import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/mongodb';
import Entry from '../../../models/Entry';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const dateKey = searchParams.get('dateKey');
    if (!dateKey) {
      return NextResponse.json({ error: 'dateKey parameter is required' }, { status: 400 });
    }

    const doc = await Entry.findOne({ dateKey });
    return NextResponse.json(doc ? doc.entries : []);
  } catch (error) {
    console.error('API GET entries error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { dateKey, entries } = body;

    if (!dateKey) {
      return NextResponse.json({ error: 'dateKey is required' }, { status: 400 });
    }

    const doc = await Entry.findOneAndUpdate(
      { dateKey },
      { entries: entries || [] },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, doc });
  } catch (error) {
    console.error('API POST entries error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
