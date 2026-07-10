import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/mongodb';
import Media from '../../../models/Media';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    const doc = await Media.findOne({ mediaId });
    if (!doc) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const match = doc.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ dataUrl: doc.dataUrl });
    }

    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('API GET media error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { mediaId, dataUrl } = await request.json();

    if (!mediaId || !dataUrl) {
      return NextResponse.json({ error: 'mediaId and dataUrl are required' }, { status: 400 });
    }

    const doc = await Media.findOneAndUpdate(
      { mediaId },
      { dataUrl },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, mediaId: doc.mediaId });
  } catch (error) {
    console.error('API POST media error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    await Media.deleteOne({ mediaId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE media error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
