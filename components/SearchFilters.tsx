// components/SearchFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce"; 

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State cục bộ
  const [text, setText] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  
  // Debounce: Chỉ search sau khi ngừng gõ 500ms
  const [query] = useDebounce(text, 500);

  useEffect(() => {
    // Khi query hoặc sort thay đổi -> Update URL
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    if (sort && sort !== "newest") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    
    // Reset về trang 1 khi search
    params.set("page", "1");

    router.push(`/courses?${params.toString()}`);
  }, [query, sort, router]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm khóa học..."
          className="pl-8"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Mới nhất</SelectItem>
          <SelectItem value="price_asc">Giá tăng dần</SelectItem>
          <SelectItem value="price_desc">Giá giảm dần</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}