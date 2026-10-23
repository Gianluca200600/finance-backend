import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {

  constructor(private readonly categoriesService: CategoriesService) { }

  @Patch('targets')
  async updateTargets(@Body() targets: { id: string; target_percent: number }[]) {
    await this.categoriesService.updateTargets(targets);
    return { success: true };
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Post('seed')
  seed() {
    return this.categoriesService.seedDefaultCategories();
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  findTree() {
    return this.categoriesService.findCategoryTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

}