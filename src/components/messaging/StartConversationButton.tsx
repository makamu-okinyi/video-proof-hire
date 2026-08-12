import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface StartConversationButtonProps {
  candidateId: string;
  employerId: string;
  jobApplicationId: string;
}

export function StartConversationButton({
  candidateId,
  jobApplicationId
}: StartConversationButtonProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const startConversation = useMutation(api.messages.startConversation);

  const handleClick = async () => {
    setLoading(true);
    try {
      await startConversation({
        otherUserId: candidateId,
        jobApplicationId: jobApplicationId as Id<'jobApplications'>,
      });
      navigate('/messages');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start conversation. Make sure the candidate is shortlisted.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      <MessageCircle className="h-4 w-4" />
      Message
    </Button>
  );
}
