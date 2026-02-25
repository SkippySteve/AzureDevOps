# Write up here

https://stevenrichards.link/blogs/azure-studies/

This is a basic example of CI/CD in Azure DevOps. It's far from perfect, but a good minimal start.

TODO: 
- Priority #1: Seperate initial deployment of Infra from updating images. Switch to `az containerapp update` for updating images
- Handling of multiple branches in Frontend/Backend repos, tagging images accordingly
- Handling of multiple branches from Frontend/Backend repos, in Infra repo, deploying accordingly
- Breaking main.bicep into multiple modules
- Maybe some security oriented steps in the Build and/or Deploy process (scanning images and code for vulns etc.)