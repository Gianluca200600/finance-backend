import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentId, ...rest } = createCategoryDto;
    let parent: Category | null = null;

    if (parentId) {
      parent = await this.categoriesRepository.findOne({ where: { id: parentId } });
      if (!parent) throw new NotFoundException(`Parent category ${parentId} not found`);
    }

    const category = this.categoriesRepository.create({ ...rest, parent });
    return this.categoriesRepository.save(category);
  }

  async findCategoryTree(): Promise<Category[]> {
    return this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.subcategories', 'sub')
      .where('category.parent_id IS NULL')
      .orderBy('category.name', 'ASC')
      .addOrderBy('sub.name', 'ASC')
      .getMany();
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: {
        subcategories: true,
        parent: true,
      },
    });
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { id },
      relations: {
        subcategories: true,
        parent: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.categoriesRepository.delete(id);
  }

  async seedDefaultCategories(): Promise<{ message: string; count: number }> {
    
    const defaultData = [
      {
        name: 'Food',
        color: '#F2392E',
        icon: 'utensils', // 🍽️ Macro Food
        subs: [
          { name: 'Groceries', icon: 'shopping-basket' },  // 🧺 / 🍏 spesa
          { name: 'Eating out', icon: 'utensils' },         // 🍴 ristorante
          { name: 'Bar', icon: 'wine-glass' },             // 🍷 drink/cocktail
          { name: 'Café', icon: 'coffee' },                // ☕ tazzina
        ],
      },
      {
        name: 'Personal',
        color: '#86F22E',
        icon: 'user', // 👤 Macro Personal
        subs: [
          { name: 'Clothes', icon: 'shirt' },              // 👕 abbigliamento
          { name: 'Electronics', icon: 'laptop' },         // 💻 tecnologia
          { name: 'Sport', icon: 'dumbbell' },             // 🏋️ fitness/palestra
          { name: 'Stationery', icon: 'pencil' },          // ✏️ cancelleria
          { name: 'Education', icon: 'graduation-cap' },    // 🎓 corsi/studio
          { name: 'Wellness', icon: 'spa' },               // 🧘 benessere
          { name: 'Books', icon: 'book' },                 // 📖 libri
          { name: 'Healthcare', icon: 'heart-pulse' },     // 💊 salute/medicina
          { name: 'Software', icon: 'code' },              // 💾 app/software
          { name: 'Hobbies', icon: 'palette' },            // 🎨 passioni/tempo libero
          { name: 'Holiday', icon: 'palmtree' },           // 🌴 vacanze/viaggi
        ],
      },
      {
        name: 'Transportation',
        color: '#5e5958',
        icon: 'car', // 🚗 Macro Transportation
        subs: [
          { name: 'Public transport', icon: 'train' },     // 🚆 metro/bus urbano
          { name: 'Taxi', icon: 'taxi' },                  // 🚕 taxi/ncc
          { name: 'Business trips', icon: 'briefcase' },   // 💼 trasferte lavoro
          { name: 'Long distance', icon: 'plane' },        // ✈️ aereo/lunga percorrenza
          { name: 'Fuel', icon: 'gas-pump' },              // ⛽ benzina/carburante
          { name: 'Parking', icon: 'square-parking' },     // 🅿️ parcheggi
          { name: 'Rental', icon: 'key' },                 // 🔑 noleggio
          { name: 'Insurance', icon: 'shield-check' },     // 🛡️ assicurazione auto
          { name: 'Maintenance', icon: 'wrench' },         // 🔧 officina/tagliando
        ],
      },
      {
        name: 'House',
        color: '#2EE8F2',
        icon: 'home', // 🏠 Macro House
        subs: [
          { name: 'Utilities', icon: 'bolt' },             // ⚡ luce/gas/acqua
          { name: 'Repairs', icon: 'hammer' },             // 🔨 manutenzione casa
          { name: 'Mortgage & Rent', icon: 'building' },   // 🏢 mutuo/affitto
          { name: 'Pets', icon: 'paw' },                   // 🐾 animali domestici
          { name: 'Insurances', icon: 'file-shield' },     // 📄 polizza casa
        ],
      },
      {
        name: 'Gifts',
        color: '#DED337',
        icon: 'gift', // 🎁 Macro Gifts
        subs: [
          { name: 'Gifts', icon: 'gift' },                 // 🎁 regali
        ],
      },
      {
        name: 'Financial',
        color: '#9A2EF2',
        icon: 'wallet', // 💰 Macro Financial
        subs: [
          { name: 'Advisory', icon: 'user-tie' },          // 👔 consulenze
          { name: 'Fines', icon: 'receipt' },              // 🧾 multe
          { name: 'Taxes', icon: 'landmark' },             // 🏛️ imposte/tasse
          { name: 'Wage', icon: 'money-bill-wave' },       // 💵 stipendio
          { name: 'Investment', icon: 'chart-line' },      // 📈 investimenti/trading
          { name: 'Gifts', icon: 'hand-holding-dollar' },  // 🧧 regali ricevuti
          { name: 'Interests', icon: 'percent' },          // % interessi
          { name: 'Refunds', icon: 'arrow-rotate-left' },  // ↩️ rimborsi
          { name: 'Sale', icon: 'tag' },                   // 🏷️ vendite private
        ],
      },
    ];

    let inserted = 0;
    for (const macro of defaultData) {
      const parent = await this.categoriesRepository.save(
        this.categoriesRepository.create({
          name: macro.name,
          color: macro.color,
          icon: macro.icon,
        }),
      );
      inserted++;

      for (const sub of macro.subs) {
        await this.categoriesRepository.save(
          this.categoriesRepository.create({
            name: sub.name,
            color: macro.color,
            icon: sub.icon,
            parent,
          }),
        );
        inserted++;
      }
    }

    return { message: 'Categories seeded with individual icons', count: inserted };
  }
}