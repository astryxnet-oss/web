import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Code2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Code2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Page not found</p>
      <p className="text-center text-muted-foreground max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button data-testid="button-go-home">
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </Link>
    </div>
  );
}
