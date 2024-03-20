const { MongoClient } = require("mongodb");
const mqtt = require("mqtt");

const MONGO_HOSTNAME = process.env.MONGO_HOSTNAME;
const MONGO_USER = process.env.MONGO_USER || "root";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "supersecret";
const MONGO_URI = process.env.MONGO_URI || `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:27017`;
const MONGO_DATABASE = process.env.MONGO_DATABASE || "hivemq";
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "test";

const HIVEMQ_BROKER_HOSTNAME = process.env.HIVEMQ_BROKER_HOSTNAME;
const HIVEMQ_BROKER_PORT = parseInt(process.env.HIVEMQ_BROKER_PORT) || 1883;
const HIVEMQ_BROKER_USERNAME = process.env.HIVEMQ_BROKER_USERNAME || "admin-user";
const HIVEMQ_BROKER_PASSWORD = process.env.HIVEMQ_BROKER_PASSWORD || "admin-password";
const HIVEMQ_BROKER_TOPIC = process.env.HIVEMQ_BROKER_TOPIC || "test";

// Connect to MongoDB
const client = new MongoClient(MONGO_URI);
let db, collection;

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db(MONGO_DATABASE);
    collection = db.collection(MONGO_COLLECTION);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

connectToMongoDB();

const mqttClient = mqtt.connect(`mqtt://${HIVEMQ_BROKER_HOSTNAME}:${HIVEMQ_BROKER_PORT}`, {
  username: HIVEMQ_BROKER_USERNAME,
  password: HIVEMQ_BROKER_PASSWORD,
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe(HIVEMQ_BROKER_TOPIC, { qos: 1 });
});

mqttClient.on("message", (topic, message) => {
  console.log(`Received message '${message.toString()}' on topic '${topic}' with QoS ${message.qos}`);
  const document = { payload: message.toString() };
  collection.insertOne(document);
});

mqttClient.on("error", (error) => {
  console.error("MQTT client error:", error);
});

process.on("SIGINT", () => {
  mqttClient.end();
  client.close();
  console.log("Disconnected from MQTT broker and MongoDB");
  process.exit();
});