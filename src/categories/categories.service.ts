import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(

    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  
  ) {}

  // Creates a new budget category
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    
    const newCategory = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(newCategory);
  
  }

  // Retrieves all categories
  async findAll(): Promise<Category[]> {
    
    return this.categoriesRepository.find();
  
  }

  // Retrieves a single category by its ID
  async findOne(id: string): Promise<Category | null> {
    
    return this.categoriesRepository.findOne({ where: { id } });
  
  }

  // Deletes a category by its ID
  async remove(id: string): Promise<void> {
    
    await this.categoriesRepository.delete(id);
  
  }

}