"use client";

import type { Product } from "@/lib/types";
import ImageCarousel from "./ImageCarousel";

interface Props {
  product: Product;
  visibleAttrs: string[];
  index: number;
}

export default function ProductTile({ product, visibleAttrs, index }: Props) {
  // Parent model tile
  if (product.parent_model) {
    return (
      <div
        className="opacity-0 border border-grey-200 rounded-lg overflow-hidden bg-white"
        style={{ animation: `fadeInUp 0.4s ease ${index * 80}ms forwards` }}
      >
        <ImageCarousel
          primarySrc={product.img_url}
          alt={`${product.brand} ${product.model}`}
          productUrl={product.url}
        />

        <div className="p-3">
          <p className="text-[11px] text-grey-500 uppercase tracking-wider mb-0.5">{product.brand}</p>
          <h3 className="font-headline font-bold italic uppercase text-[15px] leading-tight text-grey-900 m-0">
            {product.model}
          </h3>
          <div className="mt-2 space-y-1.5">
            {product.new_price && product.new_url && (
              <a
                href={product.new_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-1.5 px-2 rounded bg-grey-50 no-underline text-inherit border-l-[3px] border-brand-500 hover:bg-grey-100 transition-colors"
              >
                <span className="font-bold text-xs text-grey-800 uppercase">New</span>
                <span className="text-brand-500 font-bold text-sm">{product.new_price}</span>
              </a>
            )}
            {product.used_price && product.used_url && (
              <a
                href={product.used_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-1.5 px-2 rounded bg-grey-50 no-underline text-inherit border-l-[3px] border-brand-500 hover:bg-grey-100 transition-colors"
              >
                <span className="font-bold text-xs text-grey-800 uppercase">Used</span>
                <div className="text-right">
                  <span className="block text-[10px] text-grey-500 leading-none">Starting at</span>
                  <span className="text-brand-500 font-bold text-sm">{product.used_price}</span>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single product tile
  return (
    <div
      className="opacity-0 border border-grey-200 rounded-lg overflow-hidden bg-white"
      style={{ animation: `fadeInUp 0.4s ease ${index * 80}ms forwards` }}
    >
      {/* Image carousel with condition badge overlay */}
      <ImageCarousel
        primarySrc={product.img_url}
        alt={`${product.brand} ${product.model}`}
        productUrl={product.url}
      >
        {product.condition && product.condition !== "N/A" && (
          <span className="absolute bottom-3 left-3 bg-white border border-grey-800 px-2.5 py-1 text-[11px] font-headline font-bold italic uppercase text-grey-900 tracking-wide">
            {product.condition}
          </span>
        )}
      </ImageCarousel>

      {/* Two-column info below */}
      <div className="flex border-t border-grey-200">
        {/* Left: brand, model, price, CTA */}
        <div className="flex-1 p-3 flex flex-col border-r border-grey-200">
          <p className="text-[13px] text-grey-500 uppercase tracking-wider mb-0.5">{product.brand}</p>
          <h3 className="font-headline font-bold italic uppercase text-lg leading-tight text-grey-900 m-0 mb-auto">
            {product.model}
          </h3>
          <span className="text-brand-500 font-headline font-bold italic text-xl mt-2 block">
            {product.price}
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block bg-brand-500 text-white text-center font-headline font-bold uppercase text-sm tracking-wider px-3 py-2.5 rounded-[5px] no-underline hover:bg-brand-300 active:bg-brand-700 transition-colors"
          >
            View Details
          </a>
        </div>

        {/* Right: attributes */}
        <div className="flex-1 p-3 flex flex-col justify-center gap-1.5">
          {visibleAttrs.map((key) =>
            product.attrs[key] ? (
              <p key={key} className="text-sm leading-snug text-grey-800 m-0">
                <span className="font-bold">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>{" "}
                {product.attrs[key]}
              </p>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
