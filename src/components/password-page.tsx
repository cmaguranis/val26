import { useNavigate } from "react-router-dom";
import { PasswordPrompt } from "@/components/password-prompt";

export function PasswordPage() {
  const navigate = useNavigate();

  return (
    <PasswordPrompt 
      onSuccess={() => navigate("/love-counter")} 
    />
  );
}
