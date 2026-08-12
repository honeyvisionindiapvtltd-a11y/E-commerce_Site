
export const seedData = {
  products: [
    {id:"p1", name:"4MP AI CCTV Camera", sku:"HV-CAM-4MP", category:"CCTV Cameras", brand:"Honey Vision", price:8999, mrp:10999, stock:18, status:"Active"},
    {id:"p2", name:"Solar CCTV Camera", sku:"HV-SOLAR-01", category:"Solar CCTV", brand:"Honey Vision", price:6499, mrp:7999, stock:4, status:"Active"},
    {id:"p3", name:"8 Channel NVR", sku:"HV-NVR-08", category:"NVR", brand:"Honey Vision", price:12999, mrp:15999, stock:22, status:"Active"},
    {id:"p4", name:"1TB Surveillance HDD", sku:"HV-HDD-1TB", category:"Hard Disk", brand:"Seagate", price:4599, mrp:5299, stock:5, status:"Active"},
    {id:"p5", name:"128GB Memory Card", sku:"HV-MC-128", category:"Memory Cards", brand:"SanDisk", price:899, mrp:1199, stock:42, status:"Active"}
  ],
  categories: [
    {id:"c1", name:"CCTV Cameras", slug:"cctv-cameras", products:38, status:"Active"},
    {id:"c2", name:"Laptops", slug:"laptops", products:22, status:"Active"},
    {id:"c3", name:"Networking", slug:"networking", products:18, status:"Active"},
    {id:"c4", name:"Drones", slug:"drones", products:12, status:"Active"},
    {id:"c5", name:"Storage", slug:"storage", products:16, status:"Active"}
  ],
  orders: [
    {id:"HV1001", customer:"Rahul Sharma", phone:"9876543210", items:2, amount:8999, payment:"Paid", status:"Shipped", date:"2026-08-10"},
    {id:"HV1002", customer:"Priya Das", phone:"9876543211", items:1, amount:4599, payment:"Paid", status:"Pending", date:"2026-08-10"},
    {id:"HV1003", customer:"Amit Kumar", phone:"9876543212", items:3, amount:12999, payment:"Paid", status:"Delivered", date:"2026-08-09"},
    {id:"HV1004", customer:"Sneha Patel", phone:"9876543213", items:1, amount:6499, payment:"COD", status:"Processing", date:"2026-08-09"},
    {id:"HV1005", customer:"Rajesh Singh", phone:"9876543214", items:2, amount:899, payment:"Refunded", status:"Cancelled", date:"2026-08-08"}
  ],
  customers: [
    {id:"u1", name:"Rahul Sharma", email:"rahul@example.com", phone:"9876543210", orders:8, spent:64200, status:"Active", joined:"2026-05-12"},
    {id:"u2", name:"Priya Das", email:"priya@example.com", phone:"9876543211", orders:4, spent:21900, status:"Active", joined:"2026-06-02"},
    {id:"u3", name:"Amit Kumar", email:"amit@example.com", phone:"9876543212", orders:12, spent:118400, status:"Active", joined:"2026-03-18"},
    {id:"u4", name:"Sneha Patel", email:"sneha@example.com", phone:"9876543213", orders:2, spent:12998, status:"Blocked", joined:"2026-07-04"}
  ],
  coupons: [
    {id:"cp1", code:"WELCOME10", type:"Percentage", value:10, minOrder:1000, uses:42, expiry:"2026-12-31", status:"Active"},
    {id:"cp2", code:"HONEY500", type:"Fixed", value:500, minOrder:5000, uses:18, expiry:"2026-10-31", status:"Active"},
    {id:"cp3", code:"CCTV20", type:"Percentage", value:20, minOrder:3000, uses:7, expiry:"2026-09-30", status:"Paused"}
  ],
  reviews: [
    {id:"r1", product:"4MP AI CCTV Camera", customer:"Rahul Sharma", rating:5, comment:"Excellent clarity and night vision.", status:"Published", date:"2026-08-09"},
    {id:"r2", product:"Solar CCTV Camera", customer:"Priya Das", rating:4, comment:"Good product. Solar panel is useful.", status:"Pending", date:"2026-08-08"},
    {id:"r3", product:"8 Channel NVR", customer:"Amit Kumar", rating:2, comment:"Setup instructions need improvement.", status:"Reported", date:"2026-08-07"}
  ],
  delivery: [
    {id:"d1", order:"HV1001", courier:"Delhivery", tracking:"DEL123456", expected:"2026-08-12", status:"In Transit"},
    {id:"d2", order:"HV1003", courier:"Blue Dart", tracking:"BD987654", expected:"2026-08-10", status:"Delivered"},
    {id:"d3", order:"HV1004", courier:"DTDC", tracking:"DT456789", expected:"2026-08-13", status:"Preparing"}
  ],
  payments: [
    {id:"pay1", order:"HV1001", customer:"Rahul Sharma", gateway:"PhonePe", amount:8999, method:"UPI", status:"Success", date:"2026-08-10"},
    {id:"pay2", order:"HV1002", customer:"Priya Das", gateway:"Razorpay", amount:4599, method:"Card", status:"Success", date:"2026-08-10"},
    {id:"pay3", order:"HV1004", customer:"Sneha Patel", gateway:"COD", amount:6499, method:"Cash", status:"Pending", date:"2026-08-09"}
  ],
  blogs: [
    {id:"b1", title:"How AI Cameras Improve Business Security", category:"AI Technology", author:"Admin", status:"Published", date:"2026-08-08"},
    {id:"b2", title:"Complete Guide to Enterprise Networking", category:"Networking", author:"Admin", status:"Draft", date:"2026-08-06"}
  ],
  admins: [
    {id:"a1", name:"Super Admin", email:"admin@honeyvision.in", role:"Super Admin", status:"Active", lastLogin:"2026-08-10 10:42"},
    {id:"a2", name:"Store Manager", email:"manager@honeyvision.in", role:"Manager", status:"Active", lastLogin:"2026-08-09 17:30"}
  ],
  settings: {
    storeName:"Honey Vision India Pvt. Ltd.",
    email:"support@honeyvision.in",
    phone:"+91 98765 43210",
    currency:"INR",
    taxRate:18,
    lowStockLimit:5,
    codEnabled:true,
    onlinePaymentEnabled:true,
    maintenanceMode:false
  }
};

export function loadAdminData() {
  try {
    const raw = localStorage.getItem("honeyvision_admin_data");
    if (raw) return JSON.parse(raw);
  } catch (error) {
    console.warn("Unable to read admin dataset from localStorage:", error);
  }
  localStorage.setItem("honeyvision_admin_data", JSON.stringify(seedData));
  return JSON.parse(JSON.stringify(seedData));
}

export function saveAdminData(data) {
  localStorage.setItem("honeyvision_admin_data", JSON.stringify(data));
}
