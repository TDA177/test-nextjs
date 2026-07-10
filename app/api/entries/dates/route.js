import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/mongodb';
import Entry from '../../../../models/Entry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const docs = await Entry.find({ 'entries.0': { $exists: true } }, 'dateKey');
    const dates = docs.map(d => d.dateKey);
    dates.sort().reverse();
    return NextResponse.json(dates);
  } catch (error) {
    console.error('API GET entry dates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
