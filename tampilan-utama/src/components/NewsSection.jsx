import React, { useEffect, useState } from 'react';
import { newsAPI } from '@/lib/api';
import { Calendar, ArrowRight, Loader2, ImageOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const NewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data } = await newsAPI.getAll();
      setNews(data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-white overflow-x-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Berita &amp; Pengumuman
          </h2>
          <div className="w-16 h-1 bg-sky-600 mx-auto mb-4" />
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Update terbaru seputar layanan Trans Koetaradja
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-10 h-10 text-sky-600 animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Belum ada berita tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {news.map((item) => (
              <Card key={item.id} className="overflow-hidden border border-gray-200 flex flex-col h-full">
                {item.image_url ? (
                  <div className="relative overflow-hidden h-44 flex-shrink-0 bg-gray-100">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="hidden w-full h-full items-center justify-center text-gray-300"
                      style={{ display: 'none' }}
                    >
                      <ImageOff className="w-8 h-8" />
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-sky-600 text-white text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                    <ImageOff className="w-8 h-8 text-gray-200" />
                  </div>
                )}

                <CardHeader className="flex-grow pb-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>{item.date}</span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-2 leading-snug text-gray-900">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="py-2">
                  <CardDescription className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </CardDescription>
                </CardContent>

                <CardFooter className="pt-2">
                  <span className="text-xs text-gray-400">{item.date}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* View All */}
        <div className="text-center mt-10">
          <a
            href="https://www.instagram.com/trans.koetaradja"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="border-2 border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white px-6 py-3 rounded-xl font-semibold"
            >
              Ikuti di Instagram
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <p className="text-gray-400 text-xs mt-3">@trans.koetaradja</p>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
