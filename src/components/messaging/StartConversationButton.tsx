import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface StartConversationButtonProps {
  candidateId: string;
  employerId: string;
  jobApplicationId: string;
}

export function StartConversationButton({ 
  candidateId, 
  employerId, 
  jobApplicationId 
}: StartConversationButtonProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('employer_id', employerId)
      .eq('candidate_id', candidateId)
      .eq('job_application_id', jobApplicationId)
      .maybeSingle();

    if (existing) {
      navigate('/messages');
      return;
    }

    // Create new conversation
    const { error } = await supabase.from('conversations').insert({
      employer_id: employerId,
      candidate_id: candidateId,
      job_application_id: jobApplicationId,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Could not start conversation. Make sure the candidate is shortlisted.",
        variant: "destructive",
      });
      return;
    }

    navigate('/messages');
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
