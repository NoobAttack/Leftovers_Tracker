export type NutritionGrade = 'a' | 'b' | 'c' | 'd' | 'e';

export interface LeftoverApiDetails {
  brand?: string;
  category?: string;
  nutritionGrade?: NutritionGrade;
}

export interface LeftoverItem {
  id: string;
  name: string;
  expiryDate: string;
  createdAt: string;
  apiDetails?: LeftoverApiDetails;
}
