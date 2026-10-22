const cartStorageKey = "sonora-cart-count";
let cartCount = Math.max(0, Number(localStorage.getItem(cartStorageKey)) || 0);

const cartButton = document.querySelector("#cart-button");
const cartDialog = document.querySelector("#cart-dialog");
const cartMessage = document.querySelector("#cart-message");

function updateCart() {
  localStorage.setItem(cartStorageKey, cartCount);
  if (cartButton) {
    cartButton.textContent = `Carrito (${cartCount})`;
  }
  if (cartMessage) {
    cartMessage.textContent = `Tienes ${cartCount} ${
      cartCount === 1 ? "artículo" : "artículos"
    } en el carrito.`;
  }
}

updateCart();

const addButtons = document.querySelectorAll(
  ".cart-button:not(#empty-cart-button):not(#checkout-button)"
);
addButtons.forEach((button) => {
  button.addEventListener("click", () => {
    cartCount += 1;
    updateCart();

    button.textContent = "¡Añadido!";
    setTimeout(() => {
      button.textContent = "Añadir al carrito";
    }, 1000);
  });
});

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#site-search");
const searchableCards = document.querySelectorAll(".category-card, .product-card");

if (searchForm && searchInput) {
  function resetSearch() {
    searchInput.value = "";
    searchableCards.forEach((card) => {
      card.style.display = "";
    });
  }

  window.addEventListener("pageshow", resetSearch);

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const searchText = searchInput.value.trim().toLowerCase();

    searchableCards.forEach((card) => {
      const cardText = card.textContent.toLowerCase();
      card.style.display = cardText.includes(searchText) ? "" : "none";
    });
  });
}

const categoryCards = document.querySelectorAll(".category-card");
const categoryMessage = document.querySelector("#category-message");
categoryCards.forEach((card) => {
  function selectCategory() {
    const categoryName = card.querySelector("h2").textContent;
    if (categoryMessage) {
      categoryMessage.textContent = `Has seleccionado: ${categoryName}`;
    }
    document.querySelector(".best-sellers").scrollIntoView({ behavior: "smooth" });
  }

  card.addEventListener("click", selectCategory);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCategory();
    }
  });
});

if (cartButton) {
  cartButton.addEventListener("click", () => {
    updateCart();
    if (cartDialog) {
      cartDialog.showModal();
    } else {
      alert(`Tienes ${cartCount} artículos en el carrito.`);
    }
  });
}

const emptyCartButton = document.querySelector("#empty-cart-button");
if (emptyCartButton && cartDialog) {
  emptyCartButton.addEventListener("click", () => {
    cartCount = 0;
    updateCart();
    cartDialog.close();
  });
}

const checkoutButton = document.querySelector("#checkout-button");
if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    window.location.href = "./pago.html";
  });
}

const closeCartButton = document.querySelector("#close-cart-button");
if (closeCartButton && cartDialog) {
  closeCartButton.addEventListener("click", () => {
    cartDialog.close();
  });
}

const accountButton = document.querySelector("#account-button");
if (accountButton) {
  accountButton.addEventListener("click", (event) => {
    const userName = prompt("¿Cómo te llamas?");
    if (userName && userName.trim()) {
      event.currentTarget.textContent = `Hola, ${userName.trim()}`;
    }
  });
}

const checkoutForm = document.querySelector("#checkout-form");
if (checkoutForm) {
  const checkoutItems = document.querySelector("#checkout-items");
  const checkoutTotal = document.querySelector("#checkout-total");
  const checkoutFeedback = document.querySelector("#checkout-feedback");
  const averageItemPrice = 350;

  function updateCheckoutSummary() {
    const itemLabel = cartCount === 1 ? "artículo" : "artículos";
    checkoutItems.textContent = `${cartCount} ${itemLabel}`;
    checkoutTotal.textContent = (cartCount * averageItemPrice).toLocaleString(
      "es-ES",
      { style: "currency", currency: "EUR" }
    );
  }

  updateCheckoutSummary();

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (cartCount === 0) {
      checkoutFeedback.className = "alert alert-warning";
      checkoutFeedback.textContent = "Tu carrito está vacío. Añade algún producto antes de continuar.";
      return;
    }

    const fullName = document.querySelector("#full-name").value.trim();
    checkoutFeedback.className = "alert alert-success";
    checkoutFeedback.textContent =
      `Gracias, ${fullName}. El formulario se ha completado; ` +
      "no se ha realizado ningún cargo ni se ha enviado un pedido.";

    cartCount = 0;
    updateCart();
    updateCheckoutSummary();
    checkoutForm.reset();
  });
}
