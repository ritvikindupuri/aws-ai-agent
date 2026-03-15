import ReactMarkdown from "react-markdown";
import { Shield, User, Loader2, CheckCircle, AlertOctagon } from "lucide-react";
import cloudpilotLogo from "@/assets/cloudpilot-logo.svg";

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "error";

export interface ChatMessageData {
  id: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`animate-fade-in-up flex gap-3 px-5 py-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden text-primary">
            <img src={cloudpilotLogo} alt="" className="w-5 h-5 object-contain" />
          </div>
        </div>
      )}

      <div className={`max-w-[85%] rounded-lg px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
        isUser
          ? "bg-secondary border border-border"
          : "bg-card border border-border/50"
      }`}>
        <div className="prose prose-sm md:prose-base prose-invert max-w-none
          [&_code]:font-mono [&_code]:bg-muted/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_code]:text-[13px]
          [&_pre]:bg-[#0d1117] [&_pre]:border [&_pre]:border-border/40 [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:overflow-x-auto
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground
          [&_p]:text-foreground/90 [&_p]:leading-loose [&_p]:my-3
          [&_li]:text-foreground/90 [&_li]:my-1.5 [&_li]:leading-relaxed
          [&_strong]:text-foreground [&_strong]:font-bold
          [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-border/50
          [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2.5
          [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
          [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:my-4
          [&_th]:bg-muted/30 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:border [&_th]:border-border/50 [&_th]:text-foreground
          [&_td]:px-4 [&_td]:py-2.5 [&_td]:border [&_td]:border-border/50 [&_td]:text-foreground/90
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:bg-muted/20 [&_blockquote]:px-4 [&_blockquote]:py-1 [&_blockquote]:text-foreground/80 [&_blockquote]:my-4 [&_blockquote]:italic
          [&_hr]:border-border/50 [&_hr]:my-6
          [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc
          [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal
        ">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          {message.status === "streaming" && (
            <div className="flex items-center gap-1.5 text-terminal-dim">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-mono tracking-wider uppercase">analyzing</span>
            </div>
          )}
          {message.status === "complete" && !isUser && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle className="w-3 h-3" />
              <span className="text-[10px] font-mono">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {message.status === "error" && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertOctagon className="w-3 h-3" />
              <span className="text-[10px] font-mono">error</span>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
