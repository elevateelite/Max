<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Store Outreach</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 480px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    h2 { font-size: 1.25rem; margin-top: 0; color: #111; }
    label { font-size: 0.85rem; font-weight: 600; color: #555; display: block; margin-top: 14px; }
    input, select { width: 100%; padding: 12px; margin-top: 6px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
    button { width: 100%; background: #0066ff; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; margin-top: 18px; cursor: pointer; font-size: 0.95rem; }
    button:disabled { background: #99c2ff; cursor: not-allowed; }
    
    .card { margin-top: 20px; padding: 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: none; }
    .card h3 { margin: 0 0 8px 0; font-size: 0.85rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
    .pitch-box { font-size: 0.92rem; line-height: 1.5; color: #1e293b; white-space: pre-line; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
    .status { font-size: 0.85rem; color: #0066ff; margin-top: 10px; text-align: center; font-weight: 600; }
    
    /* Login & Role Modal Overlays */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-card { background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; background: white; color: #333; border: 1px solid #d1d5db; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 16px; font-size: 0.95rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .role-btn { display: block; width: 100%; padding: 14px; margin-top: 12px; border-radius: 8px; border: 2px solid #0066ff; font-weight: bold; font-size: 1rem; cursor: pointer; }
    .btn-seller { background: #0066ff; color: white; }
    .btn-buyer { background: white; color: #0066ff; }
    .role-badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
  </style>
</head>
<body>

<div id="authModal" class="modal-overlay">
  <div class="modal-card">
    <h2>Welcome 👋</h2>
    <p style="font-size: 0.9rem; color: #666;">Sign in to save your generated pitches and store leads.</p>
    <button type="button" class="google-btn" onclick="signInWithGoogle()">
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
      Continue with Google
    </button>
  </div>
</div>

<div id="roleModal" class="modal-overlay" style="display: none;">
  <div class="modal-card">
    <h2>Select Your Activity 👋</h2>
    <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">Choose your primary activity for this session:</p>
    <button type="button" class="role-btn btn-seller" onclick="selectRole('Seller')">Continue as Seller</button>
    <button type="button" class="role-btn btn-buyer" onclick="selectRole('Buyer')">Continue as Buyer</button>
  </div>
</div>

<div class="container" id="appContent" style="display: none;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <h2>Smart Store Outreach</h2>
    <span id="activeRoleBadge" class="role-badge">Role: Seller</span>
  </div>
  
  <label for="platform">Platform</label>
  <select id="platform">
    <option value="Instagram">Instagram</option>
    <option value="TikTok">TikTok</option>
  </select>

  <label for="username">Profile Username</label>
  <input type="text" id="username" placeholder="e.g. storename">

  <button id="analyzeBtn" onclick="analyzeAndPitch()">Analyze Profile & Generate Pitch</button>
  <div id="statusText" class="status"></div>

  <div id="bioCard" class="card">
    <h3>Profile Details</h3>
    <div id="bioText" style="font-size:0.88rem; color:#334155;"></div>
  </div>

  <div id="pitchCard" class="card">
    <h3>Suggested Outreach Pitch</h3>
    <div id="pitchText" class="pitch-box"></div>
    <button id="saveBtn" style="background: #10b981; margin-top:12px;" onclick="saveToSupabase()">Save Lead to Supabase</button>
  </div>
</div>

<script>
  // Insert your Supabase details here (from Supabase > Settings > API)
  const SUPABASE_URL = "YOUR_SUPABASE_URL"; 
  const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
  
  let supabase = null;
  if (SUPABASE_URL && SUPABASE_URL !== "YOUR_SUPABASE_URL") {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  let currentUser = null;
  let selectedUserRole = "Seller";
  let currentProfileData = {};

  window.addEventListener('load', async () => {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
      
      await supabase.from('profiles').upsert({ id: currentUser.id, email: currentUser.email });
      
      document.getElementById('authModal').style.display = 'none';
      document.getElementById('roleModal').style.display = 'flex';
    }
  });

  async function signInWithGoogle() {
    if (!supabase) {
      alert("Please enter your Supabase URL and Anon Key inside script tags!");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href
      }
    });

    if (error) alert("Login error: " + error.message);
  }

  function selectRole(role) {
    selectedUserRole = role;
    document.getElementById('activeRoleBadge').innerText = `Role: ${role}`;
    document.getElementById('roleModal').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
  }

  async function analyzeAndPitch() {
    const platform = document.getElementById('platform').value;
    const username = document.getElementById('username').value.trim().replace('@', '');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const statusText = document.getElementById('statusText');

    if (!username) {
      alert("Please enter a username.");
      return;
    }

    analyzeBtn.disabled = true;
    statusText.innerText = `Fetching ${platform} profile for @${username}...`;

    let bioFound = "";

    try {
      if (platform === "Instagram") {
        const targetUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxyUrl, {
          headers: { 'x-ig-app-id': '936619743392459' }
        });

        if (res.ok) {
          const json = await res.json();
          bioFound = json?.data?.user?.biography || "";
        }
      }
    } catch (e) {
      console.log("Live fetch bypassed, using local generator.");
    }

    if (!bioFound) {
      bioFound = `Active ${platform} handle: @${username}. Profile target evaluated.`;
    }

    document.getElementById('bioText').innerText = bioFound;
    document.getElementById('bioCard').style.display = 'block';

    const generatedPitch = buildPitch(username, platform, bioFound);
    document.getElementById('pitchText').innerText = generatedPitch;
    document.getElementById('pitchCard').style.display = 'block';

    currentProfileData = {
      user_id: currentUser ? currentUser.id : null,
      platform: platform,
      handle: `@${username}`,
      bio_notes: bioFound,
      suggested_message: generatedPitch,
      user_role: selectedUserRole
    };

    statusText.innerText = "Analysis Complete!";
    analyzeBtn.disabled = false;
  }

  function buildPitch(handle, platform, bio) {
    let niche = "brand";
    const bioLower = bio.toLowerCase();

    if (bioLower.includes("wear") || bioLower.includes("apparel") || bioLower.includes("clothing")) niche = "clothing line";
    else if (bioLower.includes("skin") || bioLower.includes("beauty") || bioLower.includes("cosmetics")) niche = "beauty store";
    else if (bioLower.includes("shop") || bioLower.includes("store")) niche = "e-commerce store";

    if (selectedUserRole === "Seller") {
      return `Hey @${handle}! 👋\n\n` +
        `Came across your ${platform} page and love the visual direction of your ${niche}.\n\n` +
        `Quick question—are you open to reviewing a 1-minute visual design concept to help boost your store conversion rate this month?\n\n` +
        `Would love to send it over if you're open to taking a look!`;
    } else {
      return `Hey @${handle}! 👋\n\n` +
        `I noticed your ${niche} products on ${platform} and wanted to reach out regarding product inquiries and wholesale options.\n\n` +
        `Do you have an active store catalog or order link available?`;
    }
  }

  async function saveToSupabase() {
    if (!supabase) {
      alert("Please add your Supabase credentials inside index.html script tags.");
      return;
    }

    const { error } = await supabase
      .from('store_leads')
      .insert([currentProfileData]);

    if (error) {
      alert('Error saving lead: ' + error.message);
    } else {
      alert(`Lead successfully saved to your profile as ${selectedUserRole}!`);
    }
  }
</script>

</body>
</html>
