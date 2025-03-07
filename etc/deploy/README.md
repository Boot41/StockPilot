# Cloud Run Deployment with Terraform

## Prerequisites
- Google Cloud SDK installed
- Terraform installed
- Google Cloud Project set up

## Variables
- `project_id`: Your Google Cloud Project ID (required)
- `region`: Deployment region (default: us-central1)
- `service_name`: Name of the Cloud Run service (default: sample-service)
- `container_image`: Container image to deploy (required)
- `container_tag`: Container image tag (default: latest)
- `environment_variables`: Map of environment variables to pass to the container

## Deployment Steps
1. Configure your Google Cloud credentials
2. Create a `terraform.tfvars` file with your specific variables:
   ```hcl
   project_id         = "your-project-id"
   container_image    = "gcr.io/your-project/your-image"
   container_tag      = "v1"
   environment_variables = {
     "ENV_VAR_NAME" = "value"
   }
   ```
3. Run:
   ```
   terraform init
   terraform apply
   ```

## Key Features
- Minimum scale set to 0 (no running costs when idle)
- Smallest resource configuration
- Supports environment variables
- Automatically outputs service URL
- Public access enabled
