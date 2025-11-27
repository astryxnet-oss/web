import { Link } from "wouter";
import { 
  MessageCircle, 
  Gamepad2, 
  Globe, 
  Trophy, 
  Monitor, 
  ShoppingBag, 
  GraduationCap, 
  Wrench,
  Play,
  Coins,
  type LucideIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { categories } from "@shared/schema";

const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  Gamepad2,
  Globe,
  Trophy,
  Monitor,
  ShoppingBag,
  GraduationCap,
  Wrench,
  Play,
  Coins,
};

interface CategoryGridProps {
  codeCounts?: Record<string, number>;
}

export function CategoryGrid({ codeCounts = {} }: CategoryGridProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Browse by Category</h2>
          <p className="text-muted-foreground">
            Find codes organized by your favorite platforms and services
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon];
            const count = codeCounts[category.id] || 0;
            
            return (
              <Link key={category.id} href={`/category/${category.id}`}>
                <Card 
                  className="p-4 hover-elevate cursor-pointer h-full transition-all duration-200"
                  data-testid={`card-category-${category.id}`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {IconComponent && (
                        <IconComponent className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
    </section>
  );
}
