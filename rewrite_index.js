const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Inject Supabase initialization
const supabaseInit = `    <!-- Supabase SDK -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        const SUPABASE_URL = 'https://cumcgpglqqscgjsxvcxb.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bWNncGdscXFzY2dqc3h2Y3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTYxNTYsImV4cCI6MjA5NTAzMjE1Nn0.K5AmDkEMg7VZkyjA46zUZjfKH4Tx-jUcwc37sTBlBdQ';
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);`;
content = content.replace('<script>', supabaseInit);

// 2. Load Profile
const oldLoadProfile = `        async function loadProfile() {
            let profile = JSON.parse(localStorage.getItem(STORAGE_PROFILE_KEY)) || defaultProfile;
            
            if (!profile.timings) {
                profile.timings = defaultProfile.timings;
                profile.special_holidays = defaultProfile.special_holidays;
                localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
            }

            // Seed contact numbers if missing or empty
            if (!profile.contact_numbers || !Array.isArray(profile.contact_numbers) || profile.contact_numbers.length === 0) {
                profile.contact_numbers = [
                    { label: "Showroom Inquiry", number: profile.whatsapp_number || defaultProfile.whatsapp_number, isPrimary: true }
                ];
                localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
            }`;

const newLoadProfile = `        async function loadProfile() {
            const { data, error } = await supabase.from('business_profile').select('*').single();
            let profile = data;
            if (error || !profile) {
                profile = JSON.parse(localStorage.getItem(STORAGE_PROFILE_KEY)) || defaultProfile;
            }
            
            if (!profile.timings) {
                profile.timings = defaultProfile.timings;
                profile.special_holidays = defaultProfile.special_holidays;
            }

            // Seed contact numbers if missing or empty
            if (!profile.contact_numbers || !Array.isArray(profile.contact_numbers) || profile.contact_numbers.length === 0) {
                profile.contact_numbers = [
                    { label: "Showroom Inquiry", number: profile.whatsapp_number || defaultProfile.whatsapp_number, isPrimary: true }
                ];
            }`;
content = content.replace(oldLoadProfile, newLoadProfile);

// 3. Load Products
const oldLoadProducts = `        async function loadProducts() {
            let products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY)) || [];

            activeProducts = products;`;

const newLoadProducts = `        async function loadProducts() {
            const { data, error } = await supabase.from('products').select('*').order('added_date', { ascending: false });
            let products = [];
            if (data && !error) {
                products = data.map(item => ({
                    ...item,
                    inStock: item.in_stock,
                    image: item.main_image
                }));
            } else {
                products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY)) || [];
            }

            activeProducts = products;`;
content = content.replace(oldLoadProducts, newLoadProducts);

fs.writeFileSync('index.html', content, 'utf8');
console.log('index.html updated successfully with Node.js');
