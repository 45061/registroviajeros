import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

import User from '../models/User';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import Revenue from '../models/Revenue';

// Conexión a MongoDB (usa tu helper si tienes uno, si no, pon la URL directo)
await mongoose.connect(process.env.MONGODB_URL!);

async function seedUsers() {
  // Limpia la colección (opcional)
  await User.deleteMany({});
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return User.create({
        _id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
      });
    })
  );
  return insertedUsers;
}

async function seedCustomers() {
  await Customer.deleteMany({});
  const insertedCustomers = await Customer.insertMany(
    customers.map((customer) => ({
      _id: customer.id,
      name: customer.name,
      email: customer.email,
      image_url: customer.image_url,
    }))
  );
  return insertedCustomers;
}

async function seedInvoices() {
  await Invoice.deleteMany({});
  const insertedInvoices = await Invoice.insertMany(
    invoices.map((invoice) => ({
      customer_id: invoice.customer_id,
      amount: invoice.amount,
      status: invoice.status,
      date: invoice.date,
    }))
  );
  return insertedInvoices;
}

async function seedRevenue() {
  await Revenue.deleteMany({});
  const insertedRevenue = await Revenue.insertMany(
    revenue.map((rev) => ({
      month: rev.month,
      revenue: rev.revenue,
    }))
  );
  return insertedRevenue;
}

export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  } finally {
    await mongoose.connection.close(); // Opcional: Cierra conexión después del seed
  }
}
