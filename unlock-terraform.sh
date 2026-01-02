#!/bin/bash
# Unlock Terraform state for QA environment

cd terraform/environments/qa

echo "Unlocking Terraform state..."
echo "yes" | terraform force-unlock ab69b1c8-5ae2-73af-a502-8a170953f020

echo "State unlocked! You can now run Terraform commands."
