
import { db } from "../db";
import { establishments } from "@shared/schema";

async function viewEstablishments() {
  try {
    const results = await db.select({
      id: establishments.id,
      external_id: establishments.external_id,
      name: establishments.name,
      cuisine: establishments.cuisine,
      address: establishments.address,
      rating: establishments.rating,
      price: establishments.price,
      priority: establishments.priority,
    }).from(establishments);

    console.table(results);
  } catch (error) {
    console.error('Error fetching establishments:', error);
  }
}

viewEstablishments().finally(() => process.exit());
