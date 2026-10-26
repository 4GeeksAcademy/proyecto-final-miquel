import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import storeReducer, { initialStore } from "../store";
import { API_BASE_URL } from "../api";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "../fallbackProducts";

const StoreContext = createContext(null);
const ACCESS_TOKEN_KEY = "sonora-access-token";
const LOCAL_CART_KEY = "sonora-local-cart";

function isConnectionError(error) {
  return error?.name === "ApiConnectionError";
}

async function apiRequest(path, options = {}) {
  const token = options.token || localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = { ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    const connectionError = new Error(
      "No se pudo conectar con el servidor. Puedes seguir consultando el catálogo y gestionando un carrito local."
    );
    connectionError.name = "ApiConnectionError";
    throw connectionError;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  if (!response.ok) {
    const requestError = new Error(data.message || "No se pudo completar la solicitud.");
    requestError.status = response.status;
    throw requestError;
  }
  return data;
}

function cartFromItems(items, products) {
  const productsById = new Map(products.map((product) => [String(product.id), product]));
  const cartItems = items.flatMap((item) => {
    const product = productsById.get(String(item.product_id));
    if (!product || item.quantity < 1) return [];
    return [{
      id: item.id || `local-${item.product_id}`,
      product_id: product.id,
      quantity: item.quantity,
      product,
      subtotal: product.price * item.quantity
    }];
  });
  return {
    items: cartItems,
    total: cartItems.reduce((total, item) => total + item.subtotal, 0)
  };
}

function readLocalCart(products, currentItems = []) {
  let savedItems = currentItems.map((item) => ({
    product_id: item.product_id ?? item.product?.id,
    quantity: item.quantity
  }));

  try {
    const storedValue = localStorage.getItem(LOCAL_CART_KEY);
    if (storedValue !== null) {
      const storedItems = JSON.parse(storedValue);
      if (Array.isArray(storedItems)) savedItems = storedItems;
    }
  } catch (error) {
    localStorage.removeItem(LOCAL_CART_KEY);
  }

  return cartFromItems(savedItems, products);
}

function saveLocalCart(items, products) {
  const savedItems = items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity
  }));
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(savedItems));
  return cartFromItems(savedItems, products);
}

export function StoreProvider({ children }) {
  const [store, dispatch] = useReducer(storeReducer, initialStore());
  const storeRef = useRef(store);
  storeRef.current = store;

  const actions = useMemo(() => {
    function loadLocalCart(products = storeRef.current.products) {
      const cart = readLocalCart(products, storeRef.current.cart);
      dispatch({ type: "cart_loaded", payload: cart });
      return cart;
    }

    function updateLocalCart(updateItems) {
      const products = storeRef.current.products;
      const currentCart = readLocalCart(products, storeRef.current.cart);
      const items = updateItems(currentCart.items);
      const cart = saveLocalCart(items, products);
      dispatch({ type: "cart_loaded", payload: cart });
      return cart;
    }

    function shouldUseLocalCart() {
      return !localStorage.getItem(ACCESS_TOKEN_KEY) || storeRef.current.offlineMode;
    }

    async function withCartFallback(request, updateItems) {
      if (shouldUseLocalCart()) return updateLocalCart(updateItems);
      try {
        const cart = await request();
        dispatch({ type: "cart_loaded", payload: cart });
        return cart;
      } catch (error) {
        if (!isConnectionError(error)) throw error;
        dispatch({ type: "offline_mode" });
        return updateLocalCart(updateItems);
      }
    }

    async function saveSession(path, credentials) {
      const session = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(credentials)
      });
      localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
      dispatch({ type: "user_loaded", payload: session.user });
      try {
        const cart = await apiRequest("/cart");
        dispatch({ type: "cart_loaded", payload: cart });
      } catch (error) {
        if (!isConnectionError(error)) throw error;
        dispatch({ type: "offline_mode" });
        loadLocalCart();
      }
      return session.user;
    }

    return {
      login: (credentials) => saveSession("/login", credentials),
      register: (details) => saveSession("/register", details),
      logout() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        dispatch({ type: "user_loaded", payload: null });
        loadLocalCart();
      },
      async loadOrders() {
        const orders = await apiRequest("/orders");
        dispatch({ type: "orders_loaded", payload: orders });
        return orders;
      },
      async updateProfile(details) {
        const user = await apiRequest("/me", {
          method: "PUT",
          body: JSON.stringify(details)
        });
        dispatch({ type: "user_loaded", payload: user });
        return user;
      },
      async deleteProfile() {
        await apiRequest("/me", { method: "DELETE" });
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        dispatch({ type: "user_loaded", payload: null });
        dispatch({ type: "orders_loaded", payload: [] });
        loadLocalCart();
      },
      async addToCart(productId, quantity = 1) {
        return withCartFallback(
          () => apiRequest("/cart/items", {
            method: "POST",
            body: JSON.stringify({ product_id: productId, quantity })
          }),
          (items) => {
            const product = storeRef.current.products.find(
              (item) => String(item.id) === String(productId)
            );
            if (!product) throw new Error("No se encontró el producto seleccionado.");
            const existing = items.find(
              (item) => String(item.product_id ?? item.product?.id) === String(productId)
            );
            const nextQuantity = (existing?.quantity || 0) + quantity;
            if (nextQuantity > product.stock) {
              throw new Error("No hay suficiente stock disponible.");
            }
            return existing
              ? items.map((item) => item === existing ? { ...item, product_id: productId, quantity: nextQuantity } : item)
              : [...items, { product_id: productId, quantity }];
          }
        );
      },
      async updateCartItem(itemId, quantity) {
        if (quantity < 1) {
          return withCartFallback(
            () => apiRequest(`/cart/items/${itemId}`, { method: "DELETE" }),
            (items) => items.filter((item) => String(item.id) !== String(itemId))
          );
        }
        return withCartFallback(
          () => apiRequest(`/cart/items/${itemId}`, {
            method: "PUT",
            body: JSON.stringify({ quantity })
          }),
          (items) => {
            const item = items.find((entry) => String(entry.id) === String(itemId));
            const product = item?.product || storeRef.current.products.find(
              (entry) => String(entry.id) === String(item?.product_id) ||
                String(entry.id) === String(itemId).replace(/^local-/, "")
            );
            if (!item || !product) throw new Error("No se encontró el artículo del carrito.");
            if (quantity > product.stock) throw new Error("No hay suficiente stock disponible.");
            return items.map((entry) => entry === item ? { ...entry, quantity } : entry);
          }
        );
      },
      async removeFromCart(itemId) {
        return withCartFallback(
          () => apiRequest(`/cart/items/${itemId}`, { method: "DELETE" }),
          (items) => items.filter((item) => String(item.id) !== String(itemId))
        );
      },
      async checkout(shippingDetails) {
        const result = await apiRequest("/checkout", {
          method: "POST",
          body: JSON.stringify(shippingDetails)
        });
        dispatch({ type: "cart_loaded", payload: { items: [], total: 0 } });
        localStorage.removeItem(LOCAL_CART_KEY);
        return result;
      }
    };
  }, []);

  useEffect(() => {
    async function loadStore() {
      let products;
      let categories;
      let offlineCatalog = false;
      try {
        [products, categories] = await Promise.all([
          apiRequest("/products"),
          apiRequest("/categories")
        ]);
      } catch (error) {
        products = FALLBACK_PRODUCTS;
        categories = FALLBACK_CATEGORIES;
        offlineCatalog = true;
      }

      dispatch({
        type: "catalog_loaded",
        payload: { products, categories, offlineCatalog }
      });

      if (offlineCatalog) dispatch({ type: "offline_mode" });

      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token && !offlineCatalog) {
        try {
          const [user, cart] = await Promise.all([
            apiRequest("/me"),
            apiRequest("/cart")
          ]);
          dispatch({ type: "user_loaded", payload: user });
          dispatch({ type: "cart_loaded", payload: cart });
          return;
        } catch (error) {
          if (error.status === 401 || error.status === 422) {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
          } else if (!isConnectionError(error)) {
            dispatch({ type: "store_error", payload: error.message });
          } else {
            dispatch({ type: "offline_mode" });
          }
        }
      }

      dispatch({ type: "cart_loaded", payload: readLocalCart(products) });
    }

    loadStore();
  }, []);

  return (
    <StoreContext.Provider value={{ store, dispatch, actions }}>
      {children}
    </StoreContext.Provider>
  );
}

export default function useGlobalReducer() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useGlobalReducer debe usarse dentro de StoreProvider.");
  }
  return context;
}
