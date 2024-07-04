function initializeSupabase() {
  const supabase = window.supabase.createClient(
    "https://rqyiibvcszfszmdhhgkg.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeWlpYnZjc3pmc3ptZGhoZ2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk2OTI1MTQsImV4cCI6MjAzNTI2ODUxNH0.v0kjLBczNMYAmI-Onwc65LYzVa9roPeo4LcFBEm98ik"
  );

  window.userDataKey = `sb-rqyiibvcszfszmdhhgkg-auth-token`;

  window.getSupabaseUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  };

  window.getUserFromLocalStorage = () => {
    return JSON.parse(localStorage.getItem(window.userDataKey)).user;
  };

  setupEventListeners(supabase);

  lucide.createIcons();
  checkUser(supabase);

  // Add this line to listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN") {
      updateLoginState(true);
    } else if (event === "SIGNED_OUT") {
      updateLoginState(false);
    }
  });
}

window.onload = function () {
  initializeSupabase();
};

function setupEventListeners(supabase) {
  const loginButton = document.getElementById("loginButton");
  loginButton.addEventListener("click", () => handleLoginLogout(supabase));

  const closeLoginModalButton = document.getElementById("closeLoginModal");
  closeLoginModalButton.addEventListener("click", closeLoginModal);

  const submitLoginFormButton = document.getElementById("submitLoginForm");
  submitLoginFormButton.addEventListener("click", () =>
    handleLoginSubmit(supabase)
  );

  // Add event listener for the email input
  const emailInput = document.getElementById("email");
  emailInput.addEventListener("input", togglePasswordField);
  emailInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLoginSubmit(supabase);
    }
  });

  // Add event listener for the password input
  const passwordInput = document.getElementById("password");
  passwordInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLoginSubmit(supabase);
    }
  });
}

function togglePasswordField() {
  const email = document.getElementById("email").value;
  const passwordField = document.getElementById("passwordField");

  if (email === "test@shipstation.ai" || email === "zero@shipstation.ai") {
    passwordField.classList.remove("hidden");
  } else {
    passwordField.classList.add("hidden");
  }
}

function openLoginModal() {
  const loginModal = document.getElementById("loginModal");
  loginModal.classList.remove("hidden");
}

function closeLoginModal() {
  const loginModal = document.getElementById("loginModal");
  loginModal.classList.add("hidden");
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

async function handleLoginSubmit(supabase) {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!validateEmail(email)) {
    showSnackbar("Please enter a valid email address", "error");
    return;
  }

  try {
    let result;
    if (email === "test@shipstation.ai" || email === "zero@shipstation.ai") {
      if (!password) {
        showSnackbar("Please enter your password", "error");
        return;
      }
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
    }

    if (result.error) throw result.error;

    if (email === "test@shipstation.ai" || email === "zero@shipstation.ai") {
      showSnackbar("Logged in!", "success");
    } else {
      showSnackbar("Check your email for the login link!", "success");
    }
    closeLoginModal();
  } catch (error) {
    console.error("Error signing in:", error);
    showSnackbar("Error signing in. Please try again.", "error");
  }
}

async function handleLoginLogout(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await handleLogout(supabase);
  } else {
    openLoginModal();
  }
}

async function getAvailableShips(supabase) {
  let { data: user_profiles, error } = await supabase
    .from("user_profiles")
    .select("available_ships");

  const availableShips = document.getElementById("availableShips");
  availableShips.textContent = `Available Ships: ${
    user_profiles[0]?.available_ships ?? 0
  }`;
  // set this to window global variable
  window.availableShips = user_profiles[0]?.available_ships ?? 0;
}

async function getCreatedShips(supabase) {
  let { data: ships, error } = await supabase.from("ships").select("slug");
  if (error) {
    console.error("Error fetching created ships:", error);
    return [];
  }
  return ships;
}

async function checkUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await getAvailableShips(supabase);
    const ships = await getCreatedShips(supabase);
    renderRecentlyShipped(ships);
  }
  updateLoginButton(user);
}

function updateLoginButton(user) {
  const loginButton = document.getElementById("loginButton");

  if (user) {
    loginButton.textContent = "Logout";
    updateLoginState(true); // Add this line
  } else {
    loginButton.textContent = "Login";
    updateLoginState(false); // Add this line
  }
}

async function handleLogout(supabase) {
  await supabase.auth.signOut();
  window.showSnackbar("You have been logged out successfully", "info");
  updateLoginButton(null);
}

// Make sure to expose the openLoginModal function
window.openLoginModal = openLoginModal;