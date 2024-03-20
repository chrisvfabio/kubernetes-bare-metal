# Kubernetes + GitHub Packages

This guide will demonstrate how to publish your container images into GitHub Packages and configure Kubernetes to pull the images from GitHub Packages.


## Steps

For the sake of an example, we'll build the hivemq-broker application and publish it to GitHub Packages.

1. Authenticate with GitHub Packages

Follow the steps on the GitHub documentation to authenticate with the Container Registry: [Authenticating with a personal access token (classic)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-with-a-personal-access-token-classic)

> [!IMPORTANT]
> Ensure the `read:packages` and `write:packages` scopes are selected when creating the personal access token.

```bash
export CR_PAT=YOUR_TOKEN
export USERNAME="<your-github-username>"

echo $CR_PAT | docker login ghcr.io -u $USERNAME --password-stdin
# > Login Succeeded
```

2. Change directory into the hivemq-broker app

```bash
cd apps/hivemq-broker
```

3. Build the container image
```bash
docker build -t ghcr.io/<USERNAME>/<NAMESPACE>/hivemq-broker:latest .
```

4. Push the container image to GitHub Packages

```bash
docker push ghcr.io/<USERNAME>/<NAMESPACE>/hivemq-broker:latest
```

---

In the Kubernetes cluster, you will need to create an Image Pull secret which has the GitHub Packages credentials.

```bash
kubectl create secret docker-registry ghcr-login-secret --docker-server=https://ghcr.io --docker-username=$YOUR_GITHUB_USERNAME --docker-password=$YOUR_GITHUB_TOKEN --docker-email=$YOUR_EMAIL
```


