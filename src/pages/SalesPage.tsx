import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Calendar, 
  CreditCard, 
  Package, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { Sale, Customer, Product, PaymentMethod } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

export const SalesPage: React.FC = () => {
  const { company } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  // Cart items in sale creation
  const [cartItems, setCartItems] = useState<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    stock_available: number;
  }[]>([]);

  // Selected product to add to cart
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const loadData = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [salesData, customersData, productsData] = await Promise.all([
        storage.getSales(company.id),
        storage.getCustomers(company.id),
        storage.getProducts(company.id),
      ]);
      setSales(salesData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const handleOpenCreate = () => {
    setCustomerId('');
    setPaymentMethod('pix');
    setDiscount(0);
    setNotes('');
    setCartItems([]);
    setSelectedProdId(products.length > 0 ? products[0].id : '');
    setSelectedQty(1);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProdId) return;
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) return;

    if (selectedQty <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    // Check already in cart
    const existingIndex = cartItems.findIndex(i => i.product_id === selectedProdId);
    const currentQtyInCart = existingIndex !== -1 ? cartItems[existingIndex].quantity : 0;
    const totalRequired = currentQtyInCart + selectedQty;

    if (prod.stock < totalRequired) {
      setErrorMsg(`Estoque insuficiente para "${prod.name}". Estoque disponível: ${prod.stock}, Solicitado: ${totalRequired}`);
      return;
    }

    setErrorMsg(null);
    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity = totalRequired;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: prod.id,
          product_name: prod.name,
          quantity: selectedQty,
          unit_price: prod.price,
          stock_available: prod.stock,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(i => i.product_id !== productId));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;

    if (cartItems.length === 0) {
      setErrorMsg('Adicione pelo menos um produto ao pedido.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await storage.createSale(company.id, {
        customer_id: customerId || null,
        items: cartItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        discount: Number(discount) || 0,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Falha ao processar venda.');
    } finally {
      setSaving(false);
    }
  };

  const paymentLabels: Record<PaymentMethod, string> = {
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    dinheiro: 'Dinheiro',
    boleto: 'Boleto Bancário',
    a_prazo: 'A Prazo / Crediário',
  };

  const filteredSales = sales.filter((s) => {
    const custName = s.customer?.name || 'Consumidor Final';
    return (
      custName.toLowerCase().includes(search.toLowerCase()) ||
      s.payment_method.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
            Vendas & Pedidos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro de vendas com baixa automática de estoque, validação e atualização de clientes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, forma de pagamento..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Total de {sales.length} venda(s) registrada(s)
        </div>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Carregando histórico de vendas...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={search ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada ainda'}
          description={
            search 
              ? 'Tente buscar com outros termos.' 
              : 'Registre sua primeira venda. O estoque será deduzido e o histórico do cliente atualizado automaticamente.'
          }
          actionText={search ? undefined : 'Registrar Primeira Venda'}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Data / Hora</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Itens</th>
                  <th className="py-3.5 px-4">Pagamento</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 sm:px-6 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(s.sale_date)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">#{s.id.slice(0, 8)}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {(s.customer?.name || 'C').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.customer?.name || 'Consumidor Final'}</p>
                          {s.customer?.phone && (
                            <p className="text-[11px] text-slate-400">{s.customer.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-700">
                      <span className="font-semibold">{s.items?.length || 1} produto(s)</span>
                      {s.items && s.items.length > 0 && (
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">
                          {s.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {paymentLabels[s.payment_method] || s.payment_method}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                      {formatCurrency(s.total)}
                      {s.discount > 0 && (
                        <p className="text-[11px] text-rose-500 font-medium font-sans">
                          Desc: {formatCurrency(s.discount)}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Concluída
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nova Venda"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cliente (Opcional)
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="">Consumidor Final (Sem cadastro)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Forma de Pagamento *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white font-semibold"
              >
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto Bancário (Gera Recebível)</option>
                <option value="a_prazo">A Prazo (Gera Recebível 30d)</option>
              </select>
            </div>
          </div>

          {/* Add Product into Cart section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-brand-600" />
              Adicionar Produtos ao Pedido
            </h4>

            {products.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nenhum produto cadastrado. Cadastre produtos no módulo de Produtos primeiro.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Produto em Estoque
                  </label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock === 0}>
                        {p.name} — {formatCurrency(p.price)} ({p.stock} un. em estoque) {p.stock === 0 ? '[ESGOTADO]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Qtd
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            )}

            {/* Cart Table */}
            {cartItems.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{item.product_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product_id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observações do Pedido
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Entrega agendada para sexta-feira"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total do Pedido</p>
              <p className="text-xl font-extrabold text-white">{formatCurrency(total)}</p>
            </div>
            <div className="text-right text-xs text-slate-300">
              <p>Subtotal: {formatCurrency(subtotal)}</p>
              {discount > 0 && <p className="text-rose-400">Desconto: -{formatCurrency(discount)}</p>}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || cartItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Concluir Venda</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
