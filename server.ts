import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';

let BACKEND_PRODUCTS = [...INITIAL_PRODUCTS];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Timeout utility to ensure endpoints respond swiftly
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Fallback curated supermarket recipes if API key is unconfigured or call times out
const FALLBACK_RECIPES = [
  {
    name: "Classic Abia Yam & Egg Porridge (Asaro)",
    description: "Tender chunks of Abuja white yam slow-cooked in rich red palm oil, fresh tomatoes, scotch bonnet, and topped with gently beaten farm eggs.",
    extraIngredients: [
      "Fresh Tuber of Abuja White Yam (Extra Large)",
      "Fresh Jos Roma Tomatoes Basket",
      "Pure Unadulterated Red Palm Oil (Traditional)",
      "Farm Fresh Large Brown Eggs (Crate of 30)",
      "Scotch Bonnet Hot Pepper (Ata Rodo)"
    ]
  },
  {
    name: "Authentic Smoky Party Jollof Rice",
    description: "Fragrant long-grain Mama Gold rice simmered in a concentrated reduced tomato & pepper base, seasoned with Knorr cubes, and paired with golden fried yellow plantains.",
    extraIngredients: [
      "Mama Gold Pure White Rice (Long Grain)",
      "Gino Magic Jollof Tomato Paste Mix (Pack of 10)",
      "Devon Kings Pure Vegetable Cooking Oil",
      "Sweet Ripe Yellow Plantains (Bunch)",
      "Knorr Chicken Flavor Seasoning Cubes"
    ]
  },
  {
    name: "Golden Penny Semovita with Rich Chicken Soup",
    description: "Smooth, velvety Semovita morsels paired with a deeply savory stew made with fresh dressed farm chicken, aromatic herbs, and sweet onions.",
    extraIngredients: [
      "Golden Penny Semovita Premium Wheat",
      "Fresh Dressed Whole Farm Chicken",
      "Fresh Jos Roma Tomatoes Basket",
      "Knorr Chicken Flavor Seasoning Cubes"
    ]
  }
];

// ================= AUTHENTICATION BACKEND STORAGE & ENDPOINTS =================
interface StoredUser {
  id: string;
  role: 'customer';
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // In-memory demo hash/password
  palmPoints: number;
  savedItemIds: string[];
  addresses: Array<{
    id: string;
    title: string;
    fullName: string;
    street: string;
    landmark: string;
    area: string;
    phone: string;
    isDefault?: boolean;
  }>;
  createdAt: string;
}

interface StoredAdmin {
  id: string;
  role: 'admin';
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  securityPin: string;
  title: string;
  assignedBranch: string;
  permissions: string[];
}

// Initial mock users database seeded with customer
const USERS_DB: StoredUser[] = [
  {
    id: 'usr-101',
    role: 'customer',
    name: 'Amaka Obi',
    email: 'amaka.obi@nuelixx.ng',
    phone: '+234 803 456 7890',
    passwordHash: 'password123',
    palmPoints: 450,
    savedItemIds: ['prod-1', 'prod-5', 'prod-7', 'prod-22'],
    addresses: [
      {
        id: 'addr-1',
        title: 'Home (Victoria Island)',
        fullName: 'Amaka Obi',
        street: '14 Victoria Island Boulevard',
        landmark: 'Opposite Mega Plaza',
        area: 'Victoria Island / Ikoyi',
        phone: '+234 803 456 7890',
        isDefault: true
      }
    ],
    createdAt: '2026-01-15T09:00:00Z'
  }
];

// Initial admin database seeded with Store Operations Director
const ADMINS_DB: StoredAdmin[] = [
  {
    id: 'adm-001',
    role: 'admin',
    name: 'Kalu Ikpe',
    email: 'kalu.ikpe@nuelixx.ng',
    phone: '+234 812 000 4455',
    passwordHash: 'adminNuelixx2026!',
    securityPin: '2026',
    title: 'Head of National Store Operations',
    assignedBranch: 'Lagos & Nationwide Central Distribution Hub',
    permissions: ['INVENTORY_WRITE', 'ORDERS_DISPATCH', 'PRICE_MANAGEMENT', 'FINANCIAL_REPORTS']
  },
  {
    id: 'adm-002',
    role: 'admin',
    name: 'Nuelixx Store Admin',
    email: 'admin@nuelixx.ng',
    phone: '+234 803 111 2233',
    passwordHash: 'admin123',
    securityPin: '2026',
    title: 'Store Operations Supervisor',
    assignedBranch: 'Abuja & Nationwide Express Fulfillment',
    permissions: ['INVENTORY_WRITE', 'ORDERS_DISPATCH', 'PRICE_MANAGEMENT']
  }
];

// Active sessions table (token -> user/admin)
const ACTIVE_SESSIONS: Map<string, { role: 'customer' | 'admin'; id: string; expiresAt: number }> = new Map();

// Helper to strip sensitive fields before returning user
function sanitizeUser(user: StoredUser) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function sanitizeAdmin(admin: StoredAdmin) {
  const { passwordHash, securityPin, ...safeAdmin } = admin;
  return safeAdmin;
}

// 1. Customer Signup Endpoint
app.post('/api/auth/user/signup', (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, street, landmark, area } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Full name, email address, and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = USERS_DB.find(u => u.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.'
      });
      return;
    }

    const newId = `usr-${Date.now()}`;
    const defaultAddress = {
      id: `addr-${Date.now()}`,
      title: 'Residential Address',
      fullName: name,
      street: street || '14 Brass Street',
      landmark: landmark || 'Near Brass Junction',
      area: area || 'Brass Junction / Aba-Owerri Rd',
      phone: phone || '+234 803 000 0000',
      isDefault: true
    };

    const newUser: StoredUser = {
      id: newId,
      role: 'customer',
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || '+234 803 000 0000').trim(),
      passwordHash: String(password),
      palmPoints: 200, // Welcome signup bonus
      savedItemIds: [],
      addresses: [defaultAddress],
      createdAt: new Date().toISOString()
    };

    USERS_DB.push(newUser);

    const token = `usr_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    ACTIVE_SESSIONS.set(token, { role: 'customer', id: newId, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to PalmGrove Supermarket Aba.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error: any) {
    console.error('Customer signup error:', error);
    res.status(500).json({ success: false, message: 'Server error creating customer account.' });
  }
});

// 2. Customer Login Endpoint
app.post('/api/auth/user/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email address and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = USERS_DB.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user || user.passwordHash !== String(password)) {
      res.status(401).json({
        success: false,
        message: 'Invalid email address or password. Please verify and try again.'
      });
      return;
    }

    const token = `usr_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    ACTIVE_SESSIONS.set(token, { role: 'customer', id: user.id, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Customer login error:', error);
    res.status(500).json({ success: false, message: 'Server error logging into customer account.' });
  }
});

// 3. Admin Login Endpoint (Separated)
app.post('/api/auth/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password, securityPin } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Official staff email and security password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = ADMINS_DB.find(a => a.email.toLowerCase() === normalizedEmail);

    if (!admin || admin.passwordHash !== String(password)) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized staff access. Invalid administrator credentials.'
      });
      return;
    }

    // Check optional security PIN if provided
    if (securityPin && admin.securityPin && String(securityPin).trim() !== admin.securityPin) {
      res.status(401).json({
        success: false,
        message: 'Invalid Manager Security Clearance PIN.'
      });
      return;
    }

    const token = `adm_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    ACTIVE_SESSIONS.set(token, { role: 'admin', id: admin.id, expiresAt: Date.now() + 24 * 3600 * 1000 });

    res.json({
      success: true,
      message: `Administrator session granted for ${admin.name} (${admin.title}).`,
      token,
      admin: sanitizeAdmin(admin)
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error processing admin authentication.' });
  }
});

// 4. Session Verification Endpoint
app.get('/api/auth/verify', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.json({ authenticated: false });
      return;
    }

    const token = authHeader.split(' ')[1];
    const session = ACTIVE_SESSIONS.get(token);

    if (!session || session.expiresAt < Date.now()) {
      ACTIVE_SESSIONS.delete(token);
      res.json({ authenticated: false });
      return;
    }

    if (session.role === 'customer') {
      const user = USERS_DB.find(u => u.id === session.id);
      if (user) {
        res.json({ authenticated: true, role: 'customer', user: sanitizeUser(user) });
        return;
      }
    } else if (session.role === 'admin') {
      const admin = ADMINS_DB.find(a => a.id === session.id);
      if (admin) {
        res.json({ authenticated: true, role: 'admin', admin: sanitizeAdmin(admin) });
        return;
      }
    }

    res.json({ authenticated: false });
  } catch (error: any) {
    res.json({ authenticated: false });
  }
});

// 5. Logout Endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    ACTIVE_SESSIONS.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ================= PRODUCT CATALOG & INVENTORY ENDPOINTS =================
// GET: Fetch current inventory products
app.get('/api/products', (_req: Request, res: Response) => {
  res.json({ success: true, products: BACKEND_PRODUCTS });
});

// POST: Add new product (Used by Admin Dashboard)
app.post('/api/products', (req: Request, res: Response) => {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      subcategory,
      unit,
      brand,
      stock,
      image,
      description,
      dietaryTags,
      isOrganic,
      isLocalFarm,
      storageInstructions
    } = req.body;

    if (!name || price === undefined || !category) {
      res.status(400).json({ success: false, message: 'Product name, price, and category are required.' });
      return;
    }

    const newProduct = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(name).trim(),
      price: Math.max(10, Number(price)),
      originalPrice: originalPrice ? Math.max(10, Number(originalPrice)) : undefined,
      category: String(category).toLowerCase(),
      subcategory: subcategory ? String(subcategory) : 'General',
      unit: unit ? String(unit) : '1 Unit',
      brand: brand ? String(brand) : 'Nuelixx Express',
      stock: stock !== undefined ? Math.max(0, Number(stock)) : 25,
      rating: 5.0,
      reviewCount: 0,
      isOrganic: Boolean(isOrganic),
      isLocalFarm: Boolean(isLocalFarm),
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : (dietaryTags ? [String(dietaryTags)] : ['Nationwide Express', 'Guaranteed Fresh']),
      image: image && String(image).trim().length > 0 
        ? String(image).trim() 
        : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      description: description ? String(description).trim() : `Freshly stocked ${name} available for express delivery to any state in Nigeria.`,
      storageInstructions: storageInstructions ? String(storageInstructions).trim() : 'Store in a cool, clean environment.',
      reviews: []
    };

    BACKEND_PRODUCTS.unshift(newProduct);

    res.status(201).json({
      success: true,
      message: `Product "${newProduct.name}" added successfully to Aba inventory.`,
      product: newProduct
    });
  } catch (err: any) {
    console.error('Error adding product:', err);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// PUT: Update price or stock of a product
app.put('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { price, stock } = req.body;
    const prodIndex = BACKEND_PRODUCTS.findIndex(p => p.id === id);

    if (prodIndex === -1) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (price !== undefined) BACKEND_PRODUCTS[prodIndex].price = Math.max(10, Number(price));
    if (stock !== undefined) BACKEND_PRODUCTS[prodIndex].stock = Math.max(0, Number(stock));

    res.json({
      success: true,
      message: `Product ${BACKEND_PRODUCTS[prodIndex].name} updated successfully.`,
      product: BACKEND_PRODUCTS[prodIndex]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// Endpoint 1: Smart Search & Product Suggestions
app.post('/api/gemini/smart-suggestions', async (req: Request, res: Response) => {
  try {
    const { query, availableProducts } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.json({ recommendedIds: [] });
      return;
    }

    const products = Array.isArray(availableProducts) ? availableProducts : [];
    
    // Quick fuzzy fallback matching
    const fallbackMatches = products
      .filter((p: any) => 
        (p.name && p.name.toLowerCase().includes(query.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(query.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
      )
      .map((p: any) => p.id);

    if (!ai) {
      res.json({ recommendedIds: fallbackMatches });
      return;
    }

    const productList = products
      .slice(0, 25)
      .map((p: any) => `${p.name} (ID: ${p.id})`)
      .join(", ");

    const fetchPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Based on the supermarket shopper query: "${query}", which of these products would you recommend? Available products: ${productList}. Return the recommendations as a JSON array of matching product IDs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const response = await withTimeout(fetchPromise, 4500, null);

    if (response) {
      const parsed = JSON.parse(response.text || "{}");
      const ids = Array.isArray(parsed.recommendedIds) ? parsed.recommendedIds : fallbackMatches;
      res.json({ recommendedIds: ids });
    } else {
      res.json({ recommendedIds: fallbackMatches });
    }
  } catch (err: any) {
    console.error("Server-side smart suggestions error:", err?.message || err);
    const { query, availableProducts } = req.body;
    const fallbackMatches = Array.isArray(availableProducts) 
      ? availableProducts
          .filter((p: any) => p.name && p.name.toLowerCase().includes((query || '').toLowerCase()))
          .map((p: any) => p.id)
      : [];
    res.json({ recommendedIds: fallbackMatches });
  }
});

// Endpoint 2: AI Recipe Suggestions
app.post('/api/gemini/recipe-suggestions', async (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body;
    const ingredientList = Array.isArray(ingredients) && ingredients.length > 0
      ? ingredients
      : ['White Yam', 'Roma Tomatoes', 'Plantain', 'Farm Chicken'];

    if (!ai) {
      res.json({ recipes: FALLBACK_RECIPES });
      return;
    }

    const fetchPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Give me 3 simple, delicious supermarket grocery meal ideas using some or all of these ingredients: ${ingredientList.join(", ")}. Provide the name, a short 1-2 sentence description, and a list of extra ingredients needed from the store.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              extraIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const response = await withTimeout(fetchPromise, 5000, null);

    if (response) {
      const parsed = JSON.parse(response.text || "[]");
      const recipes = Array.isArray(parsed) && parsed.length > 0 ? parsed : FALLBACK_RECIPES;
      res.json({ recipes });
    } else {
      res.json({ recipes: FALLBACK_RECIPES });
    }
  } catch (err: any) {
    console.error("Server-side recipe suggestions error:", err?.message || err);
    res.json({ recipes: FALLBACK_RECIPES });
  }
});

// Endpoint 3: Server-Sent Events Streaming Recipe Generator
app.post('/api/gemini/recipe-stream', async (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body;
    const ingredientList = Array.isArray(ingredients) && ingredients.length > 0 
      ? ingredients 
      : ['Fresh Yam', 'Tomatoes', 'Eggs'];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!ai) {
      res.write(`data: ${JSON.stringify({ text: "Here is a recipe idea using your fresh supermarket ingredients: " + FALLBACK_RECIPES[0].name + ".\n" + FALLBACK_RECIPES[0].description })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const stream = await ai.models.generateContentStream({
      model: "gemini-3.8-flash",
      contents: `Write a quick, inspiring 3-step grocery recipe using these fresh ingredients: ${ingredientList.join(', ')}. Keep it concise, practical, and inviting for a home cook.`,
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error("Server-side recipe streaming error:", err?.message || err);
    res.write(`data: ${JSON.stringify({ text: "Here is a recipe idea: " + FALLBACK_RECIPES[0].name + ".\n" + FALLBACK_RECIPES[0].description })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Vite middleware or Static files serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`PalmGrove Supermarket server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
