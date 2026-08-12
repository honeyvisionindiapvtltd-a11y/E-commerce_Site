
import { useEffect,useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate,adminDelete,adminList,adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import {Field,inputClass} from "../components/FormField";
import { products as projectProducts } from "../../../lib/products";

const projectProductRows = projectProducts.map((product) => ({
  id: product.id,
  name: product.name,
  sku: (product.id || "").toUpperCase(),
  category: product.category,
  brand: product.brand,
  price: Number(product.price || 0),
  mrp: Number(product.mrp || product.price || 0),
  stock: Number(product.stock || 0),
  status: "Active",
}));

const mergeProductRows = (storedRows = []) => {
  const map = new Map();

  projectProductRows.forEach((product) => map.set(product.id, product));
  storedRows.forEach((product) => {
    if (product?.id) {
      map.set(product.id, { ...map.get(product.id), ...product });
    }
  });

  return Array.from(map.values());
};

const blank={name:"",sku:"",category:"CCTV Cameras",brand:"Honey Vision",price:"",mrp:"",stock:"",status:"Active"};

export default function Products(){
 const [rows,setRows]=useState(projectProductRows),[search,setSearch]=useState(""),[filter,setFilter]=useState("All"),[open,setOpen]=useState(false),[edit,setEdit]=useState(null),[form,setForm]=useState(blank);
 useEffect(()=>{(async()=>{ const storedRows = await adminList("products"); setRows(mergeProductRows(storedRows)); })()},[]);
 const save=async e=>{e.preventDefault(); const payload={...form,price:Number(form.price),mrp:Number(form.mrp),stock:Number(form.stock)}; if(edit) await adminUpdate("products",edit.id,payload); else await adminCreate("products",payload); setRows(mergeProductRows(await adminList("products"))); setOpen(false); setEdit(null); setForm(blank)};
 const remove=async id=>{if(confirm("Delete this product?")){await adminDelete("products",id);setRows(mergeProductRows(await adminList("products")))}};
 const filtered=rows.filter(x=>(filter==="All"||x.status===filter)&&Object.values(x).join(" ").toLowerCase().includes(search.toLowerCase()));
 const columns=[
  {key:"name",label:"Product",render:r=><div><b className="text-xs">{r.name}</b><p className="text-[9px] text-slate-400">{r.sku}</p></div>},
  {key:"category",label:"Category"}, {key:"price",label:"Price",render:r=>`₹${r.price.toLocaleString()}`},
  {key:"stock",label:"Stock",render:r=><span className={r.stock<=5?"font-bold text-red-500":"text-slate-600"}>{r.stock}</span>},
  {key:"status",label:"Status",render:r=><span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">{r.status}</span>},
  {key:"actions",label:"Actions",render:r=><div className="flex gap-1"><button onClick={()=>{setEdit(r);setForm(r);setOpen(true)}} className="rounded p-1.5 hover:bg-slate-100"><Pencil size={14}/></button><button onClick={()=>remove(r.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14}/></button></div>}
 ];
 return <><PageHeader title="Products" description="Manage your complete product catalog." action={<button onClick={()=>{setEdit(null);setForm(blank);setOpen(true)}} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-400 hover:text-slate-950"><Plus size={15}/>Add Product</button>}/>
 <Toolbar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} options={["Active","Inactive"]}/>
 <Table columns={columns} rows={filtered}/>
 <Modal open={open} title={edit?"Edit Product":"Add Product"} onClose={()=>setOpen(false)}>
  <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
   {["name","sku","brand","price","mrp","stock"].map(k=><Field key={k} label={k.toUpperCase()}><input required value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className={inputClass}/></Field>)}
   <Field label="CATEGORY"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className={inputClass}><option>CCTV Cameras</option><option>Laptops</option><option>Networking</option><option>Drones</option><option>Storage</option></select></Field>
   <Field label="STATUS"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inputClass}><option>Active</option><option>Inactive</option></select></Field>
   <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={()=>setOpen(false)} className="rounded-lg border px-4 py-2 text-xs">Cancel</button><button className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">Save Product</button></div>
  </form>
 </Modal></>
}
