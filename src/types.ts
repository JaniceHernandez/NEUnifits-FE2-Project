export interface SizeData {
  [size: string]: number;
}

export interface PriceData {
  [size: string]: number;
}

export interface Product {
  name: string;
  category: 'college' | 'highschool' | 'accessories';
  sizes: SizeData;
  prices: PriceData;
  imageUrl: string;
  hidden?: boolean;
}

export interface Inventory {
  college: { [name: string]: Product };
  highschool: { [name: string]: Product };
  accessories: { [name: string]: Product };
}

export interface User {
  uid?: string;
  name?: string;
  displayName?: string;
  email: string;
  picture?: string;
  photoURL?: string;
  role: 'superadmin' | 'admin' | 'student';
  blocked?: boolean;
  createdAt?: string;
}

export const DEFAULT_DATA: Inventory = {
  college: {
    "Male Polo": {
      name: "Male Polo",
      category: "college",
      sizes: { "XS": 9, "S": 20, "M": 13, "L": 28, "XL": 13, "2XL": 4, "3XL": 30 },
      prices: { "XS": 370, "S": 380, "M": 390, "L": 400, "XL": 410, "2XL": 420, "3XL": 430 },
      imageUrl: "https://scontent.fmnl3-4.fna.fbcdn.net/v/t39.30808-6/509429023_1253290813079077_6736925442078321057_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=BkaioyWJmpIQ7kNvwFjzcqo&_nc_oc=Adq3mF4L-CiFLLD0oE8gC1EIysODJKYk8xjeapXmdk40eU_qF5CbUDxmx8lbAhfbF-E&_nc_zt=23&_nc_ht=scontent.fmnl3-4.fna&_nc_gid=f9MXfd__7dzej8Mi1mYvXQ&_nc_ss=7a3a8&oh=00_Afzy-6IwtBJWXziTxh3yRuM8a_EuB0GLB2jS_rtdlzmo7g&oe=69D06896"
    },
    "Female Blouse": {
      name: "Female Blouse",
      category: "college",
      sizes: { "XS": 3, "S": 56, "M": 2, "L": 73, "XL": 15, "2XL": 3, "3XL": 5, "4XL": 5 },
      prices: { "XS": 350, "S": 360, "M": 370, "L": 380, "XL": 390, "2XL": 400, "3XL": 410, "4XL": 420 },
      imageUrl: "https://scontent.fmnl3-1.fna.fbcdn.net/v/t39.30808-6/653863602_2806781536366229_1579544941591703231_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=YBaQdsxn-xMQ7kNvwEHqtle&_nc_oc=Adq0RcnQnOcgNhOvN_qe4q2KPlvQkEp9kH_IrNWlsIaRHNhWAc1VuziCLFB3h5RYZAE&_nc_zt=23&_nc_ht=scontent.fmnl3-1.fna&_nc_gid=jowkyArjJ5ajFTQ6_vyzrA&_nc_ss=7a3a8&oh=00_AfxyCajs_zq7BvHWq86FsQjjBOwikyXWQtXvDkl1682jjw&oe=69D06B5A"
    },
    "Male Pants": {
      name: "Male Pants",
      category: "college",
      sizes: { "26": 23, "28": 1, "30": 3, "32": 13, "34": 6, "36": 0, "38": 5, "40": 6, "42": 18 },
      prices: { "26": 360, "28": 390, "30": 420, "32": 450, "34": 480, "36": 510, "38": 540, "40": 570, "42": 600 },
      imageUrl: "https://scontent.fmnl37-2.fna.fbcdn.net/v/t39.30808-6/626138572_1427374775434768_2922248417939840496_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=-K4oS1D9W7wQ7kNvwHgFsc7&_nc_oc=AdppFTdz0Ue9DdfDuUs7mnl4EyK7eFPxdMadWvDLmWvAUnbExmMz3mAbPJEwKmfjamI&_nc_zt=23&_nc_ht=scontent.fmnl37-2.fna&_nc_gid=OiPKJJco07rzYP8aCR-fTw&_nc_ss=7a3a8&oh=00_Afwy5ykcWfCY4rrH10zgXcq5k5dKLkBjvtCxc19zO9rTrw&oe=69D086BF"
    },
    "Female Skirt": {
      name: "Female Skirt",
      category: "college",
      sizes: { "S": 26, "M": 71, "L": 39, "XL": 1, "XXL": 0, "XXXL": 32 },
      prices: { "S": 300, "M": 320, "L": 340, "XL": 360, "XXL": 380, "XXXL": 400 },
      imageUrl: "https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-6/655944250_2806781533032896_2325039122714105815_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=vUvh38YK20oQ7kNvwFxlf1y&_nc_oc=AdrLUUeWIQv-GvuFjNqX9qFfkn3cYZrQ_B_188Mkf292RsSB_uYFClFZZWqOyhq4PxU&_nc_zt=23&_nc_ht=scontent.fmnl3-2.fna&_nc_gid=I8hbEmJLKfFpvnj1Ba88IQ&_nc_ss=7a3a8&oh=00_AfzC-8JluZ7B6x9x8Jzk1YKZFRXWU5KSVy9PYnprywqyQw&oe=69D0419F"
    }
  },
  highschool: {
    "Female Blouse": {
      name: "Female Blouse",
      category: "highschool",
      sizes: { "XS": 5, "S": 85, "M": 54, "L": 1, "XL": 8, "2XL": 0, "3XL": 8, "4XL": 0 },
      prices: { "XS": 350, "S": 360, "M": 370, "L": 380, "XL": 390, "2XL": 400, "3XL": 410, "4XL": 420 },
      imageUrl: "https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/618915437_2487698225073617_856249627010846671_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeFi_Q9QmtBe8YLNxImZZ3mhpGorVtMdTkqkaitW0x1OSkiaYbWT9tIa3p6b3fUN9exIXe42bh7aXPdLKowPa_vA&_nc_ohc=bnTWZUiDhnQQ7kNvwFJGNJz&_nc_oc=AdprKipXQujBma6xn9dc4RsyChXCpnOjgYdHTdEH8SyNxxCa1WOypeIhV_LYra_s554&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=YSMd3-87548KK5Edr_Hjbg&_nc_ss=7a3a8&oh=00_AfwU3rWfiKcRStywkGWoSv8nn86zgBOqA3duOX4zFA9kDw&oe=69D05C61"
    },
    "Male Polo": {
      name: "Male Polo",
      category: "highschool",
      sizes: { "XS": 3, "S": 5, "M": 8, "L": 87, "XL": 0, "2XL": 8, "3XL": 1 },
      prices: { "XS": 370, "S": 380, "M": 390, "L": 400, "XL": 410, "2XL": 420, "3XL": 430 },
      imageUrl: "https://scontent.fmnl37-1.fna.fbcdn.net/v/t39.30808-6/487861886_3527428837389759_5097311927363812206_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=m5RnDpH-8dUQ7kNvwEdYFk3&_nc_oc=AdqGgAD-vcT1TbElWh5ThfyYj9KIn9GJTdBpYOYPZN2Gwqb9L1v-g3xnjM6nqGPkCZg&_nc_zt=23&_nc_ht=scontent.fmnl37-1.fna&_nc_gid=x2xtVdxk8ZNdbav2PQKyJw&_nc_ss=7a3a8&oh=00_AfzaQHJZxPVXptpxXcmHEh1HSesNd-ennduSCK5xu6ERqQ&oe=69D0513F"
    },
    "Male Pants": {
      name: "Male Pants",
      category: "highschool",
      sizes: { "26": 0, "28": 2, "30": 0, "32": 54, "34": 0, "36": 51, "38": 0, "40": 73, "42": 7 },
      prices: { "26": 360, "28": 390, "30": 420, "32": 450, "34": 480, "36": 510, "38": 540, "40": 570, "42": 600 },
      imageUrl: "https://scontent.fmnl37-2.fna.fbcdn.net/v/t39.30808-6/626138572_1427374775434768_2922248417939840496_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=-K4oS1D9W7wQ7kNvwHgFsc7&_nc_oc=AdppFTdz0Ue9DdfDuUs7mnl4EyK7eFPxdMadWvDLmWvAUnbExmMz3mAbPJEwKmfjamI&_nc_zt=23&_nc_ht=scontent.fmnl37-2.fna&_nc_gid=OiPKJJco07rzYP8aCR-fTw&_nc_ss=7a3a8&oh=00_Afwy5ykcWfCY4rrH10zgXcq5k5dKLkBjvtCxc19zO9rTrw&oe=69D086BF"
    },
    "Female Skirt": {
      name: "Female Skirt",
      category: "highschool",
      sizes: { "S": 58, "M": 7, "L": 30, "XL": 2, "XXL": 36, "XXXL": 45 },
      prices: { "S": 300, "M": 320, "L": 340, "XL": 360, "XXL": 380, "XXXL": 400 },
      imageUrl: "https://scontent.fmnl17-3.fna.fbcdn.net/v/t39.30808-6/529921095_1706943029936395_8799433491096365766_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeHf_l9bb6ndula78zQUhASsI-xwqKZCIuoj7HCopkIi6koA37sL_BsX-iMQrAAmemHIBcyBLaGLJh6rK38Fmeio&_nc_ohc=eOWCgbnzGqwQ7kNvwGnnV_G&_nc_oc=AdqTKlG3uZbyfYvg4Vu5IQw3wSch5OAQ93s0Nlw_7sctIKFgWIZjG4XxHyroas4pxN8&_nc_zt=23&_nc_ht=scontent.fmnl17-3.fna&_nc_gid=I96u7PkDaZ51TPZqEdCW1A&_nc_ss=7a3a8&oh=00_Afy7frLnGGhFkP53-xUVUyMHlZmYwG0FjFCzDFw06OniMQ&oe=69D05D44"
    },
    "Female Vest": {
      name: "Female Vest",
      category: "highschool",
      sizes: { "S": 22, "M": 53, "L": 45 },
      prices: { "S": 280, "M": 300, "L": 320 },
      imageUrl: "https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/530905316_1706943046603060_3086122907445541430_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeHsZZR3b-DSiuTEana-AOPCedXQ0ZkcTYh51dDRmRxNiGx4OBBfPR2T5v5jd44JOQakFEsOYOg0hB1GlC5X4E0H&_nc_ohc=8wPc080_MeUQ7kNvwEILXt8&_nc_oc=AdrlW-QSokd0gjnDHybHIwzpYec7rfGnubtJ2h0fEkk0vwX0jjr6nu1qLrhOWeWDE5s&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=pHvJNaVvn1xJ0inYwl_X3Q&_nc_ss=7a3a8&oh=00_Afz2kPSIkXPoD6-pTp4Oc-wSTcsO7nD-EITbvXCLHMefyw&oe=69D04DD4"
    },
    "Male Vest": {
      name: "Male Vest",
      category: "highschool",
      sizes: { "S": 13, "M": 11, "L": 5 },
      prices: { "S": 280, "M": 300, "L": 320 },
      imageUrl: "https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-6/487427219_3527428760723100_9099992775641111567_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=e06c5d&_nc_ohc=68OB-kZaCDQQ7kNvwE3Rd7d&_nc_oc=AdqszCokiBQIedOS-edu_3guCA227mjBPrrHrPQ_h78NY9PtZia-s8HbxEstjp8P4MU&_nc_zt=23&_nc_ht=scontent.fmnl3-2.fna&_nc_gid=h7mbxftaHiiZhU2N8STWmA&_nc_ss=7a3a8&oh=00_Afw_zhi7etQFg5ZnrGsb2HMx6i6bZb7NyT1qD8lqFP8Nog&oe=69D067F5"
    }
  },
  accessories: {
    "College Necktie": {
      name: "College Necktie",
      category: "accessories",
      sizes: { "Onesize": 20 },
      prices: { "Onesize": 40 },
      imageUrl: "https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/497746923_1235338968331011_1783837633541703225_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeES7IXMVRo_AMkq1MLexf48ysqHfAJ3gezKyoekAneB7Otqf3hK9VQXwRO1gm19U4h74bsVE_B4R_SeodKiN8uf&_nc_ohc=cBgoqN7Ew24Q7kNvwGvbF2-&_nc_oc=AdoBaXae1yL5SCAKGeM9RfgG83d59GLebJwmZR3sIxhesgU5W9TP5q9mye8773zTYcQ&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=5anzPA-1KXdR-UMHLdtAkA&_nc_ss=7a3a8&oh=00_AfxOPXtukHhFYWTfDG77zDmPBTcAp8ELEYZp1_JGTiUvag&oe=69D05089"
    },
    "Junior HS Necktie": {
      name: "Junior HS Necktie",
      category: "accessories",
      sizes: { "Onesize": 5 },
      prices: { "Onesize": 50 },
      imageUrl: "https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/497746923_1235338968331011_1783837633541703225_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeES7IXMVRo_AMkq1MLexf48ysqHfAJ3gezKyoekAneB7Otqf3hK9VQXwRO1gm19U4h74bsVE_B4R_SeodKiN8uf&_nc_ohc=cBgoqN7Ew24Q7kNvwGvbF2-&_nc_oc=AdoBaXae1yL5SCAKGeM9RfgG83d59GLebJwmZR3sIxhesgU5W9TP5q9mye8773zTYcQ&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=5anzPA-1KXdR-UMHLdtAkA&_nc_ss=7a3a8&oh=00_AfxOPXtukHhFYWTfDG77zDmPBTcAp8ELEYZp1_JGTiUvag&oe=69D05089"
    },
    "Senior HS Necktie": {
      name: "Senior HS Necktie",
      category: "accessories",
      sizes: { "Onesize": 8 },
      prices: { "Onesize": 75 },
      imageUrl: "https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/497746923_1235338968331011_1783837633541703225_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeES7IXMVRo_AMkq1MLexf48ysqHfAJ3gezKyoekAneB7Otqf3hK9VQXwRO1gm19U4h74bsVE_B4R_SeodKiN8uf&_nc_ohc=cBgoqN7Ew24Q7kNvwGvbF2-&_nc_oc=AdoBaXae1yL5SCAKGeM9RfgG83d59GLebJwmZR3sIxhesgU5W9TP5q9mye8773zTYcQ&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=5anzPA-1KXdR-UMHLdtAkA&_nc_ss=7a3a8&oh=00_AfxOPXtukHhFYWTfDG77zDmPBTcAp8ELEYZp1_JGTiUvag&oe=69D05089"
    },
    "Neu Patch": {
      name: "Neu Patch",
      category: "accessories",
      sizes: { "Big": 52, "Small": 57 },
      prices: { "Big": 50, "Small": 25 },
      imageUrl: "https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/497746923_1235338968331011_1783837633541703225_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=e06c5d&_nc_eui2=AeES7IXMVRo_AMkq1MLexf48ysqHfAJ3gezKyoekAneB7Otqf3hK9VQXwRO1gm19U4h74bsVE_B4R_SeodKiN8uf&_nc_ohc=cBgoqN7Ew24Q7kNvwGvbF2-&_nc_oc=AdoBaXae1yL5SCAKGeM9RfgG83d59GLebJwmZR3sIxhesgU5W9TP5q9mye8773zTYcQ&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=5anzPA-1KXdR-UMHLdtAkA&_nc_ss=7a3a8&oh=00_AfxOPXtukHhFYWTfDG77zDmPBTcAp8ELEYZp1_JGTiUvag&oe=69D05089"
    },
    "Neu Button": {
      name: "Neu Button",
      category: "accessories",
      sizes: { "Onesize": 5 },
      prices: { "Onesize": 2.5 },
      imageUrl: ""
    },
    "Zipper": {
      name: "Zipper",
      category: "accessories",
      sizes: { "Onesize": 41 },
      prices: { "Onesize": 6 },
      imageUrl: ""
    },
    "Accessories Set": {
      name: "Accessories Set",
      category: "accessories",
      sizes: { "Onesize": 28 },
      prices: { "Onesize": 40 },
      imageUrl: ""
    }
  }
};

export const ALLOWED_DOMAIN = "@neu.edu.ph";
export const NEU_LOGO_URL = "https://upload.wikimedia.org/wikipedia/en/c/c6/New_Era_University.svg";

export const INITIAL_SUPERADMIN_EMAILS = [
  "mariaantonette.espinosa@neu.edu.ph",
  "alyssabernadette.tuliao@neu.edu.ph",
  "janice.marsep.17@gmail.com"
];

export const INITIAL_ADMIN_EMAILS = [
  "admin@neu.edu.ph"
];

export interface ManagedUser {
  email: string;
  role: 'superadmin' | 'admin' | 'student';
  blocked: boolean;
  addedAt: string;
}

export interface CartItem {
  productName: string;
  category: string;
  size: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  studentEmail: string;
  studentName: string;
  studentUid: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'ready' | 'completed' | 'cancelled';
  pickupDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'order_update' | 'system';
  createdAt: string;
}
