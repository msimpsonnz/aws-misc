module "step_function" {
  source = "terraform-aws-modules/step-functions/aws"

  name       = "my-step-function"
  definition = file("${path.module}/states.json")
  type = "EXPRESS"
}