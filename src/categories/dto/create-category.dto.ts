export class CreateCategoryDto {

  name!: string;
  color?: string;
  icon?: string;
  target_percent?: number;
  parentId?: string | null;
  
}
