
import { useEffect,useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate,adminDelete,adminListCategories,adminListProducts,adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import {Field,inputClass} from "../components/FormField";
const toProductRow = (product) => ({
  ...product,
  id: product._id || product.id,
  category: product.category?.name || product.category || "Uncategorized",
  price: Number(product.price || 0),
  mrp: Number(product.mrp || product.price || 0),
  stock: Number(product.stock || 0),
  status: product.isActive === false ? "Inactive" : "Active",
});

const toProductRows = (products = []) => products.map((product, index) => ({
 ...toProductRow(product),
 serialNo: index + 1,
}));

const toProductForm = (product) => ({
 name: product.name || "",
 sku: product.sku || "",
 slug: product.slug || "",
 category: product.category?._id || product.category || "",
 brand: product.brand || "Honey Vision",
 price: product.price ?? "",
 mrp: product.mrp ?? "",
 stock: product.stock ?? "",
 status: product.isActive === false ? "Inactive" : "Active",
});

const blank={name:"",sku:"",slug:"",category:"",brand:"Honey Vision",price:"",mrp:"",stock:"",status:"Active"};

const makeSlug = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Products(){
 const [rows,setRows]=useState([]),[search,setSearch]=useState(""),[filter,setFilter]=useState("All"),[open,setOpen]=useState(false),[edit,setEdit]=useState(null),[form,setForm]=useState(blank),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [totalProducts,setTotalProducts]=useState(0),[categories,setCategories]=useState([]);
 const refresh=async()=>{setLoading(true);setError("");try{const result=await adminListProducts();setRows(toProductRows(result.products));setTotalProducts(result.totalProducts ?? result.products?.length ?? 0)}catch(error){setError(error.message || "Unable to load products from MongoDB.")}finally{setLoading(false)}};
 useEffect(()=>{
  let mounted=true;
  Promise.all([adminListProducts(), adminListCategories()]).then(([productResult, categoryResult])=>{
  if(mounted){setRows(toProductRows(productResult.products));setTotalProducts(productResult.totalProducts ?? productResult.products?.length ?? 0);setCategories(categoryResult)}
  }).catch(error=>{
   if(mounted)setError(error.message || "Unable to load products from MongoDB.");
  }).finally(()=>{
   if(mounted)setLoading(false);
  });
  return ()=>{mounted=false};
 },[]);
 const save=async e=>{e.preventDefault(); try { const payload={name:form.name,sku:form.sku,slug:form.slug || makeSlug(form.name),category:form.category,brand:form.brand,price:Number(form.price),mrp:Number(form.mrp),stock:Number(form.stock),isActive:form.status === "Active"}; if(edit) await adminUpdate("products",edit.id,payload); else await adminCreate("products",payload); await refresh(); setOpen(false); setEdit(null); setForm(blank)} catch(error) { setError(error.message || "Unable to save product.") }};
 const remove=async id=>{if(confirm("Delete this product?")){try{await adminDelete("products",id);await refresh()}catch(error){setError(error.message || "Unable to delete product.")}}};
 const filtered=rows.filter(x=>(filter==="All"||x.status===filter)&&Object.values(x).join(" ").toLowerCase().includes(search.toLowerCase()));
 const columns=[
  {key:"serialNo",label:"S.No."},
  {key:"name",label:"Product",render:r=><div><b className="text-xs">{r.name}</b><p className="text-[9px] text-slate-400">{r.sku}</p></div>},
  {key:"category",label:"Category"}, {key:"price",label:"Price",render:r=>`₹${r.price.toLocaleString()}`},
  {key:"stock",label:"Stock",render:r=><span className={r.stock<=5?"font-bold text-red-500":"text-slate-600"}>{r.stock}</span>},
  {key:"status",label:"Status",render:r=><span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">{r.status}</span>},
  {key:"actions",label:"Actions",render:r=><div className="flex gap-1"><button onClick={()=>{setEdit(r);setForm(toProductForm(r));setOpen(true)}} className="rounded p-1.5 hover:bg-slate-100"><Pencil size={14}/></button><button onClick={()=>remove(r.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14}/></button></div>}
 ];
 return <><PageHeader title="Products" description="Manage your complete product catalog." action={<button disabled={!categories.length} onClick={()=>{setEdit(null);setForm({...blank,category:categories[0]?._id || ""});setOpen(true)}} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15}/>Add Product</button>}><span className="self-center text-xs font-semibold text-slate-500">{totalProducts.toLocaleString()} total</span></PageHeader>
 {error&&<div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><span>{error}</span><button onClick={refresh} className="font-semibold underline">Retry</button></div>}
 <Toolbar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} options={["Active","Inactive"]}/>
 {loading?<p className="py-12 text-center text-sm text-slate-500">Loading products...</p>:<Table columns={columns} rows={filtered}/>} 
 <Modal open={open} title={edit?"Edit Product":"Add Product"} onClose={()=>setOpen(false)}>
  <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
   {["name","sku","brand","price","mrp","stock"].map(k=><Field key={k} label={k.toUpperCase()}><input required value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className={inputClass}/></Field>)}
  <Field label="CATEGORY"><select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className={inputClass}><option value="">Select category</option>{categories.map(category=><option key={category._id} value={category._id}>{category.name}</option>)}</select></Field>
   <Field label="STATUS"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inputClass}><option>Active</option><option>Inactive</option></select></Field>
   <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={()=>setOpen(false)} className="rounded-lg border px-4 py-2 text-xs">Cancel</button><button className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">Save Product</button></div>
  </form>
 </Modal></>
}
