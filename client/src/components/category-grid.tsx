import { Link } from "wouter";
import { 
  MessageCircle, 
  Gamepad2, 
  Globe, 
  Bot,
  Puzzle,
  Server,
  type LucideIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { categories } from "@shared/schema";

const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  Gamepad2,
  Globe,
  Bot,
  Puzzle,
  Server,
};

interface CategoryGridProps {
  codeCounts?: Record<string, number>;
}

export function CategoryGrid({ codeCounts = {} }: CategoryGridProps) {
  const codeCategories = categories.filter(c => c.type === "codes");
  const advertisingCategories = categories.filter(c => c.type === "advertising");

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Free Codes</h2>
            <p className="text-muted-foreground">
              Find free codes shared by the community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {codeCategories.map((category) => {
              const IconComponent = iconMap[category.icon];
              const count = codeCounts[category.id] || 0;
              
              return (
                <Link key={category.id} href={`/category/${category.id}`}>
                  <Card 
                    className="p-6 hover-elevate cursor-pointer h-full transition-all duration-200 hover:border-pink-500/30"
                    data-testid={`card-category-${category.id}`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                        {IconComponent && (
                          <IconComponent className="h-7 w-7 text-pink-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {count} {count === 1 ? "code" : "codes"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Advertising</h2>
            <p className="text-muted-foreground">
              Promote your Discord bots, servers, and Minecraft addons
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {advertisingCategories.map((category) => {
              const IconComponent = iconMap[category.icon];
              const count = codeCounts[category.id] || 0;
              
              return (
                <Link key={category.id} href={`/category/${category.id}`}>
                  <Card 
                    className="p-6 hover-elevate cursor-pointer h-full transition-all duration-200 hover:border-purple-500/30"
                    data-testid={`card-category-${category.id}`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                        {IconComponent && (
                          <IconComponent className="h-7 w-7 text-purple-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {count} {count === 1 ? "listing" : "listings"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
