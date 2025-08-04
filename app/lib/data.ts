import Revenue from '../models/Revenue';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import { formatCurrency } from './utils';
import type { RevenueType } from '../models/Revenue';
import { dbConnect } from './mongodb';

export async function fetchRevenue(): Promise<RevenueType[]> {
  try {
    await dbConnect();
    const data = await Revenue.find().lean();
    return (data as unknown as RevenueType[]) || [];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await Invoice.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      { $sort: { date: -1 } },
      { $limit: 5 },
      {
        $project: {
          amount: 1,
          id: '$_id',
          name: '$customer.name',
          image_url: '$customer.image_url',
          email: '$customer.email',
        },
      },
    ]);

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    await dbConnect();
    const [numberOfInvoices, numberOfCustomers, statusAggregation] =
      await Promise.all([
        Invoice.countDocuments(),
        Customer.countDocuments(),
        Invoice.aggregate([
          {
            $group: {
              _id: null,
              paid: {
                $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] },
              },
              pending: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0],
                },
              },
            },
          },
        ]),
      ]);

    const totalPaidInvoices = formatCurrency(statusAggregation[0]?.paid ?? 0);
    const totalPendingInvoices = formatCurrency(
      statusAggregation[0]?.pending ?? 0
    );

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const matchQuery = {
      $or: [
        { 'customer.name': { $regex: query, $options: 'i' } },
        { 'customer.email': { $regex: query, $options: 'i' } },
        { amount: { $regex: query, $options: 'i' } }, // Si amount es string. Si es number, convertir a string
        { date: { $regex: query, $options: 'i' } },
        { status: { $regex: query, $options: 'i' } },
      ],
    };

    const invoices = await Invoice.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      { $match: matchQuery },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: ITEMS_PER_PAGE },
      {
        $project: {
          id: '$_id',
          amount: 1,
          date: 1,
          status: 1,
          name: '$customer.name',
          email: '$customer.email',
          image_url: '$customer.image_url',
        },
      },
    ]);

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const matchQuery = {
      $or: [
        { 'customer.name': { $regex: query, $options: 'i' } },
        { 'customer.email': { $regex: query, $options: 'i' } },
        { amount: { $regex: query, $options: 'i' } },
        { date: { $regex: query, $options: 'i' } },
        { status: { $regex: query, $options: 'i' } },
      ],
    };

    const data = await Invoice.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      { $match: matchQuery },
      { $count: 'count' },
    ]);

    const totalPages = Math.ceil((data[0]?.count ?? 0) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await Invoice.find({ _id: id }).lean();

    if (!data) return null;

    return {
      ...data,
      amount: data[0].amount / 100,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await Customer.find({}, { id: 1, name: 1 })
      .sort({ name: 1 })
      .lean();
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await Customer.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'customer_id',
          as: 'invoices',
        },
      },
      {
        $addFields: {
          total_invoices: { $size: '$invoices' },
          total_pending: {
            $sum: {
              $map: {
                input: '$invoices',
                as: 'invoice',
                in: {
                  $cond: [
                    { $eq: ['$$invoice.status', 'pending'] },
                    '$$invoice.amount',
                    0,
                  ],
                },
              },
            },
          },
          total_paid: {
            $sum: {
              $map: {
                input: '$invoices',
                as: 'invoice',
                in: {
                  $cond: [
                    { $eq: ['$$invoice.status', 'paid'] },
                    '$$invoice.amount',
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          email: 1,
          image_url: 1,
          total_invoices: 1,
          total_pending: 1,
          total_paid: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
