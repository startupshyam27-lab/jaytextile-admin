const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

// 1. Inject Supabase initialization
const supabaseInit = `    <!-- Supabase SDK -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        const SUPABASE_URL = 'https://cumcgpglqqscgjsxvcxb.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bWNncGdscXFzY2dqc3h2Y3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTYxNTYsImV4cCI6MjA5NTAzMjE1Nn0.K5AmDkEMg7VZkyjA46zUZjfKH4Tx-jUcwc37sTBlBdQ';
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);`;
content = content.replace('<script>', supabaseInit);

// 2. Auth Updates
const oldAuth = `        // Auth Functions
        const STORAGE_ADMINS_KEY = "jaytextile_admins";
        const STORAGE_CURRENT_ADMIN_KEY = "jaytextile_current_admin";`;
const newAuth = `        // Auth Functions
        const STORAGE_CURRENT_ADMIN_KEY = "jaytextile_current_admin";`;
content = content.replace(oldAuth, newAuth);

const oldInitAuth = `            let admins = JSON.parse(localStorage.getItem(STORAGE_ADMINS_KEY));
            if (!admins || admins.length === 0) {
                admins = [{ username: 'jaytextile222324', password: 'jaytextile2026' }];
                localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(admins));
            }`;
content = content.replace(oldInitAuth, '');

const oldAdminLogin = `            const admins = JSON.parse(localStorage.getItem(STORAGE_ADMINS_KEY)) || [];
            const validAdmin = admins.find(a => a.username === username && a.password === password);

            setTimeout(() => {
                submitBtn.innerHTML = 'Authenticate <span class="material-symbols-outlined text-[18px]">vpn_key</span>';
                submitBtn.disabled = false;

                if (validAdmin) {
                    localStorage.setItem(STORAGE_CURRENT_ADMIN_KEY, username);
                    errorMsg.classList.add('hidden');
                    isAuthenticated = true;
                    document.getElementById('admin-login-overlay').classList.add('hidden');
                    document.getElementById('admin-logout-btn').classList.remove('hidden');
                    loadDashboardData();
                    showToast('Login Successful', \`Welcome back, \${username}.\`);
                    document.getElementById('login-form').reset();
                } else {
                    errorMsg.textContent = "Invalid username or password.";
                    errorMsg.classList.remove('hidden');
                }
            }, 600); // Simulate network delay for UX`;
const newAdminLogin = `            const { data: validAdmin, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            submitBtn.innerHTML = 'Authenticate <span class="material-symbols-outlined text-[18px]">vpn_key</span>';
            submitBtn.disabled = false;

            if (validAdmin) {
                localStorage.setItem(STORAGE_CURRENT_ADMIN_KEY, username);
                errorMsg.classList.add('hidden');
                isAuthenticated = true;
                document.getElementById('admin-login-overlay').classList.add('hidden');
                document.getElementById('admin-logout-btn').classList.remove('hidden');
                loadDashboardData();
                showToast('Login Successful', \`Welcome back, \${username}.\`);
                document.getElementById('login-form').reset();
            } else {
                errorMsg.textContent = "Invalid username or password.";
                errorMsg.classList.remove('hidden');
            }`;
content = content.replace(oldAdminLogin, newAdminLogin);

const oldAddAdmin = `            let admins = JSON.parse(localStorage.getItem(STORAGE_ADMINS_KEY)) || [];
            
            if (admins.find(a => a.username === newUsername)) {
                showToast('Error', 'Username already exists.', true);
                return;
            }

            admins.push({ username: newUsername, password: newPassword });
            localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(admins));
            
            showToast('Admin Created', \`Sub-admin "\${newUsername}" has been added successfully.\`);
            document.getElementById('add-admin-form').reset();
            closeAdminModal();`;
const newAddAdmin = `            const submitBtn = document.getElementById('add-admin-form').querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Creating...';
            submitBtn.disabled = true;
            
            const { data, error } = await supabase
                .from('admins')
                .insert([{ username: newUsername, password: newPassword }]);
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            if (error) {
                showToast('Error', error.message || 'Username already exists.', true);
                return;
            }

            showToast('Admin Created', \`Sub-admin "\${newUsername}" has been added successfully.\`);
            document.getElementById('add-admin-form').reset();
            closeAdminModal();`;
content = content.replace(oldAddAdmin, newAddAdmin);
content = content.replace('function handleAddAdmin', 'async function handleAddAdmin');

// 3. Load Data Updates
const oldFetchProfile = `        async function fetchProfile() {
            if (!profile) {
                profile = JSON.parse(localStorage.getItem(STORAGE_PROFILE_KEY)) || defaultProfile;
            }
        }`;
const newFetchProfile = `        async function fetchProfile() {
            const { data, error } = await supabase.from('business_profile').select('*').single();
            if (data && !error) {
                profile = data;
            } else {
                profile = JSON.parse(localStorage.getItem(STORAGE_PROFILE_KEY)) || defaultProfile;
            }
        }`;
content = content.replace(oldFetchProfile, newFetchProfile);

const oldFetchProducts = `        async function fetchProducts() {
            products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY)) || [];
        }`;
const newFetchProducts = `        async function fetchProducts() {
            const { data, error } = await supabase.from('products').select('*').order('added_date', { ascending: false });
            if (data && !error) {
                products = data.map(item => ({
                    ...item,
                    inStock: item.in_stock,
                    image: item.main_image
                }));
            } else {
                products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY)) || [];
            }
        }`;
content = content.replace(oldFetchProducts, newFetchProducts);

// 4. Delete
const oldDel = `                products.splice(idx, 1);
                localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));`;
const newDel = `                if (p.id) {
                    await supabase.from('products').delete().eq('id', p.id);
                }
                products.splice(idx, 1);`;
content = content.replace(oldDel, newDel);

// 5. Submit Form
const oldForm = `            if (editingProductIndex > -1) {
                products[editingProductIndex] = item;
                showToast("Collection Updated", \`"\${titleVal}" updated successfully.\`);
            } else {
                products.push(item);
                showToast("Collection Added", \`"\${titleVal}" added to active inventory.\`);
            }
            localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));

            resetForm();
            renderProducts();`;
const newForm = `            const dbItem = {
                item_code: titleVal.toLowerCase().replace(/\\s+/g, '-'),
                title: titleVal,
                fabric: materialVal,
                type: categoryVal,
                tag: tagVal,
                in_stock: stockVal,
                details: detailsVal,
                color: colorVal,
                size: sizeVal,
                images: mappedImages,
                main_image: mappedImages[0] ? mappedImages[0].url : fallbackProductImage
            };

            const submitBtn = document.getElementById('submit-btn');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Saving...';
            submitBtn.disabled = true;

            if (editingProductIndex > -1) {
                const currentId = products[editingProductIndex].id;
                if (currentId) {
                    await supabase.from('products').update(dbItem).eq('id', currentId);
                }
                products[editingProductIndex] = { ...item, ...dbItem, id: currentId, inStock: stockVal, image: dbItem.main_image };
                showToast("Collection Updated", \`"\${titleVal}" updated successfully.\`);
            } else {
                const { data, error } = await supabase.from('products').insert([dbItem]).select();
                if (data && data.length > 0) {
                    const newItem = data[0];
                    products.unshift({ ...item, ...newItem, inStock: newItem.in_stock, image: newItem.main_image });
                } else {
                    products.unshift({ ...item, ...dbItem, inStock: stockVal, image: dbItem.main_image });
                }
                showToast("Collection Added", \`"\${titleVal}" added to active inventory.\`);
            }

            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;

            resetForm();
            renderProducts();`;
content = content.replace(oldForm, newForm);

// 6. Profile Form
const oldProfileSave = `            profile = updatedProfile;
            localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));`;
const newProfileSave = `            const { error } = await supabase.from('business_profile').update(updatedProfile).eq('id', 1);
            if (error) {
                showToast("Error Saving Profile", error.message, true);
                return;
            }
            profile = updatedProfile;`;
content = content.replace(oldProfileSave, newProfileSave);

fs.writeFileSync('admin.html', content, 'utf8');
console.log('admin.html updated successfully with Node.js');
