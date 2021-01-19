import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    return this.ormRepository.save(product);
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProducts = await this.ormRepository.findOne({
      where: { name },
    });

    return findProducts;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProducts = products.map(async product => {
      const findProduct = await this.ormRepository.findOne(product.id);

      if (!findProduct) throw new AppError('Product not found.');

      return findProduct;
    });

    const foundProducts = await Promise.all(findProducts);

    return foundProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds = products.map(product => product.id);

    const findProducts = await this.ormRepository.findByIds(productsIds);

    const updatedProducts = findProducts.map(findProduct => {
      const currentProduct = products.find(
        product => product.id === findProduct.id,
      );

      if (!currentProduct) return findProduct;

      if (findProduct.quantity < currentProduct.quantity)
        throw new AppError('Insufficient products on stock.');

      const quantity = findProduct.quantity - currentProduct.quantity;

      return {
        ...findProduct,
        quantity,
      };
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
