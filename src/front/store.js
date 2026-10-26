export const initialStore = () => ({
  message: null,
  todos: [],
  products: [],
  categories: [],
  cart: [],
  cartTotal: 0,
  user: null,
  orders: [],
  isLoading: true,
  offlineCatalog: false,
  offlineMode: false,
  error: null
});

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return { ...store, message: action.payload };
    case "add_task":
      return {
        ...store,
        todos: store.todos.map((todo) =>
          todo.id === action.payload.id
            ? { ...todo, background: action.payload.color }
            : todo
        )
      };
    case "catalog_loaded":
      return {
        ...store,
        products: action.payload.products,
        categories: action.payload.categories,
        offlineCatalog: Boolean(action.payload.offlineCatalog),
        isLoading: false,
        error: null
      };
    case "cart_loaded":
      return {
        ...store,
        cart: action.payload.items,
        cartTotal: action.payload.total
      };
    case "user_loaded":
      return { ...store, user: action.payload };
    case "orders_loaded":
      return { ...store, orders: action.payload };
    case "offline_mode":
      return { ...store, offlineMode: true };
    case "store_error":
      return { ...store, isLoading: false, error: action.payload };
    default:
      return store;
  }
}
