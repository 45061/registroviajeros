import mongoose from 'mongoose';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';

await mongoose.connect(process.env.MONGODB_URL!);

export async function listInvoices() {
  // Asegúrate de estar conectado a MongoDB antes de llamar a esto
  // Puedes poner tu lógica de conexión aquí o usar tu helper dbConnect()

  // Busca las facturas con amount = 666 y trae también el nombre del cliente
  const data = await Invoice.aggregate([
    { $match: { amount: 666 } },
    {
      $lookup: {
        from: 'customers', // nombre de la colección en minúscula
        localField: 'customer_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' }, // Para que customer sea un objeto, no un array
    {
      $project: {
        amount: 1,
        name: '$customer.name',
        _id: 0, // Si no quieres mostrar el _id de invoice
      },
    },
  ]);
  return data;
}

export async function GET() {
  try {
    // Asegúrate de conectar a la BD si no lo has hecho aún
    // await dbConnect();

    const invoices = await listInvoices();
    return Response.json(invoices);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
