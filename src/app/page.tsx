"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  badge?: string;
  image?: string;
  emoji: string;
};

type SupportMessage = {
  id: string | number;
  name: string;
  message: string;
  emoji: string;
  created_at?: string;
  audio_path?: string | null;
  audio_duration?: number | null;
};

const WHATSAPP_NUMBER = "971559595383";

const menuItems: MenuItem[] = [
  {
    id: "pasta-arrabiata-cheetos",
    name: "Pasta Arrabiata with Cheetos",
    price: 18,
    description: "A fun spicy pasta with a crunchy Cheetos twist.",
    ingredients: ["Pasta", "Arrabiata sauce", "Cheese", "Cheetos crunch"],
    badge: "Maher recommends",
    image: "/images/pasta.jpg",
    emoji: "🍝",
  },
  {
    id: "mac-cheese",
    name: "Mac & Cheese",
    price: 18,
    description: "Creamy, cheesy, cozy, and super yummy.",
    ingredients: ["Macaroni", "Cheese sauce", "Extra cheesy goodness"],
    badge: "Hot favorite",
    image: "/images/mac-cheese.jpg",
    emoji: "🧀",
  },
  {
    id: "crepe",
    name: "Crepe (2 pcs)",
    price: 7,
    description: "Soft sweet crepes ready for delicious toppings.",
    ingredients: ["Crepe batter", "Sweet filling base"],
    badge: "Sweet treat",
    image: "/images/crepe.jpg",
    emoji: "🥞",
  },
  {
    id: "combo-offer",
    name: "Salt & Sweet Combo",
    price: 22,
    description: "Pick one savory favorite with one sweet crepe.",
    ingredients: ["Choose Pasta + Crepe", "or Mac & Cheese + Crepe"],
    badge: "Best deal",
    image: "/images/combo.jpg",
    emoji: "⭐",
  },
];

const crepeToppings = [
  { id: "nutella", name: "Nutella", price: 3 },
  { id: "chocolate", name: "Chocolate", price: 3 },
  { id: "strawberry", name: "Strawberry", price: 3 },
  { id: "banana", name: "Banana", price: 3 },
];

const starterSupportMessages: SupportMessage[] = [
  {
    id: 1,
    name: "A friendly neighbor",
    message: "Good luck Chef Maher! Your menu already looks super yummy and professional.",
    emoji: "🍓",
  },
  {
    id: 2,
    name: "A future customer",
    message: "I love the idea of a little chef in the neighborhood. Keep cooking and keep shining!",
    emoji: "⭐",
  },
  {
    id: 3,
    name: "Someone cheering for you",
    message: "Can’t wait to try your food. Wishing Chef Maher lots of happy orders!",
    emoji: "💛",
  },
];

const emojiOptions = ["🍓", "⭐", "💛", "🎉", "🧁"];

function formatAED(value: number) {
  return `${value} AED`;
}

function MenuImageCard({ image, emoji, name }: { image?: string; emoji: string; name: string }) {
  if (image) {
    return (
      <div className="relative mb-4 h-44 overflow-hidden rounded-[24px] shadow-inner">
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="mb-4 flex h-40 items-center justify-center rounded-[24px] border-2 border-dashed border-[#ffd1dc] bg-gradient-to-br from-[#fff7fb] to-[#fff3ea] text-center shadow-inner">
      <div className="space-y-2 px-4">
        <div className="text-5xl">{emoji}</div>
        <div className="text-sm font-bold text-[#c95b52]">Photo coming soon</div>
        <div className="text-xs text-[#8b6b6b]">{name}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [crepeToppingsSelected, setCrepeToppingsSelected] = useState<string[]>([]);
  const [comboChoice, setComboChoice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [house, setHouse] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");

  const [supportName, setSupportName] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportAudioUrl, setSupportAudioUrl] = useState<string | null>(null);
  const [supportAudioBlob, setSupportAudioBlob] = useState<Blob | null>(null);
  const [supportAudioDuration, setSupportAudioDuration] = useState<number | null>(null);
  const [supportWallMessages, setSupportWallMessages] = useState<SupportMessage[]>(starterSupportMessages);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const supportRecorderRef = useRef<MediaRecorder | null>(null);
  const supportChunksRef = useRef<Blob[]>([]);
  const supportStartedAtRef = useRef<number | null>(null);
  const [isSupportRecording, setIsSupportRecording] = useState(false);

  useEffect(() => {
    const loadApprovedMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id,name,message,audio_path,audio_duration,created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped = data.map((row, index) => ({
          id: row.id,
          name: row.name || "A kind neighbor",
          message: row.message || "Sent a cheerful message for Chef Maher.",
          audio_path: row.audio_path,
          audio_duration: row.audio_duration,
          created_at: row.created_at,
          emoji: emojiOptions[index % emojiOptions.length],
        }));
        setSupportWallMessages(mapped);
      }
    };

    loadApprovedMessages();
  }, []);

  const updateQty = (id: string, delta: number) => {
    const currentQty = quantities[id] || 0;
    const nextQty = Math.max(0, currentQty + delta);

    setQuantities((prev) => ({ ...prev, [id]: nextQty }));

    if (id === "crepe") {
      setCrepeToppingsSelected((prev) => {
        if (nextQty > prev.length) return [...prev, ...Array(nextQty - prev.length).fill("")];
        return prev.slice(0, nextQty);
      });
    }

    if (id === "combo-offer" && nextQty === 0) {
      setComboChoice("");
    }
  };

  const updateCrepeTopping = (index: number, value: string) => {
    setCrepeToppingsSelected((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const selectedItems = useMemo(() => {
    return menuItems
      .map((item) => ({ item, qty: quantities[item.id] || 0 }))
      .filter((entry) => entry.qty > 0);
  }, [quantities]);

  const subtotal = useMemo(() => selectedItems.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0), [selectedItems]);
  const toppingPrice = useMemo(() => crepeToppingsSelected.filter(Boolean).length * 3, [crepeToppingsSelected]);
  const total = subtotal + toppingPrice;

  const whatsappMessage = useMemo(() => {
    const lines: string[] = ["Hello! I want to order from Chef Maher’s Yummy Corner 🍓", "", "My order:"];

    if (selectedItems.length === 0) {
      lines.push("- No items selected yet");
    } else {
      selectedItems.forEach(({ item, qty }) => {
        if (item.id === "combo-offer" && comboChoice) {
          lines.push(`- ${item.name} x${qty} — ${formatAED(item.price * qty)}`);
          lines.push(`  • Selected combo: ${comboChoice}`);
        } else if (item.id === "combo-offer" && !comboChoice) {
          lines.push(`- ${item.name} x${qty} — ${formatAED(item.price * qty)}`);
          lines.push(`  • Selected combo: Not chosen yet`);
        } else {
          lines.push(`- ${item.name} x${qty} — ${formatAED(item.price * qty)}`);
        }
      });
    }

    if ((quantities.crepe || 0) > 0) {
      crepeToppingsSelected.forEach((topping, index) => {
        if (topping) lines.push(`- Crepe ${index + 1} topping: ${topping} — ${formatAED(3)}`);
      });
    }

    lines.push("", `Total: ${formatAED(total)}`, "", `Full name: ${customerName || "-"}`, `Mobile number: ${mobileNumber || "-"}`, `Building / Villa / House No.: ${house || "-"}`, `Street / Landmark: ${landmark || "-"}`, `Extra instructions: ${instructions || "-"}`, "", "Thank you Chef Maher 👨‍🍳");
    return lines.join("\n");
  }, [selectedItems, comboChoice, quantities.crepe, crepeToppingsSelected, total, customerName, mobileNumber, house, landmark, instructions]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const startSupportRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      supportChunksRef.current = [];
      supportStartedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) supportChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(supportChunksRef.current, { type: "audio/webm" });
        if (supportAudioUrl) URL.revokeObjectURL(supportAudioUrl);
        const url = URL.createObjectURL(blob);
        setSupportAudioBlob(blob);
        setSupportAudioUrl(url);
        const seconds = supportStartedAtRef.current ? Math.max(1, Math.round((Date.now() - supportStartedAtRef.current) / 1000)) : null;
        setSupportAudioDuration(seconds);
        stream.getTracks().forEach((track) => track.stop());
      };
      supportRecorderRef.current = recorder;
      recorder.start();
      setIsSupportRecording(true);
    } catch {
      alert("Microphone access was blocked. Please allow microphone access and try again.");
    }
  };

  const stopSupportRecording = () => {
    supportRecorderRef.current?.stop();
    setIsSupportRecording(false);
  };

  const resetSupportRecording = () => {
    if (supportAudioUrl) URL.revokeObjectURL(supportAudioUrl);
    setSupportAudioUrl(null);
    setSupportAudioBlob(null);
    setSupportAudioDuration(null);
  };

  const submitSupportMessage = async () => {
    if (!supportName.trim() && !supportMessage.trim() && !supportAudioBlob) {
      alert("Add at least a name, a sweet message, or a voice note for Chef Maher first.");
      return;
    }

    setIsSubmittingSupport(true);
    setSupportSuccess(null);
    let audioPath: string | null = null;

    try {
      if (supportAudioBlob) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
        audioPath = `pending/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("support-audio").upload(audioPath, supportAudioBlob, { contentType: "audio/webm", upsert: false });
        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await supabase.from("support_messages").insert({
        name: supportName.trim() || "A kind neighbor",
        message: supportMessage.trim() || "Sent a cheerful voice message for Chef Maher.",
        audio_path: audioPath,
        audio_duration: supportAudioDuration,
        status: "pending",
      });
      if (insertError) throw insertError;

      setSupportSuccess("Your yummy message was sent for Chef Maher’s review 💛");
      setSupportName("");
      setSupportMessage("");
      resetSupportRecording();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while sending the message. Try again in a moment.");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff7f4] text-[#3c2c2c]">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="overflow-hidden rounded-[32px] border-4 border-[#ffb5c8] bg-gradient-to-br from-[#ffe8f0] via-[#fff6ef] to-[#ffe3d1] shadow-[0_20px_60px_rgba(242,106,75,0.18)]">
          <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#f26a4b] shadow-sm">👨‍🍳 Made by Chef Maher</span>
              <div className="space-y-3">
                <h1 className="text-4xl font-black leading-tight text-[#ef5d46] md:text-6xl">Chef Maher’s <br /> Yummy Corner</h1>
                <p className="max-w-xl text-lg text-[#6f4f4f] md:text-xl">A fun little neighborhood food menu made with love, big chef energy, and extra yum.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[#fff] px-4 py-2 text-sm font-semibold text-[#d24e6e]">😋 Approved by tiny food critics</span>
                <span className="rounded-full bg-[#fff] px-4 py-2 text-sm font-semibold text-[#d24e6e]">⭐ Fresh and yummy</span>
                <span className="rounded-full bg-[#fff] px-4 py-2 text-sm font-semibold text-[#d24e6e]">💌 Send by WhatsApp</span>
              </div>
              <div className="rounded-[24px] bg-white/80 p-4 shadow-md">
                <div className="mb-2 text-sm font-black uppercase tracking-wide text-[#ef5d46]">Open Hours</div>
                <div className="space-y-1 text-sm text-[#6f4f4f]">
                  <div><strong>Thu – Fri – Sat</strong>: 12:00 PM – 3:00 PM</div>
                  <div><strong>Sunday</strong>: 5:00 PM – 8:00 PM</div>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[30px] shadow-lg min-h-[340px]">
              <Image src="/images/maher-hero.jpg" alt="Chef Maher cooking" fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5">
                <p className="text-xl font-black text-white">Fresh from Maher’s little kitchen</p>
                <p className="text-sm text-white/90">Tiny chef. Big flavor. Real neighborhood magic.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#ef5d46]">Today’s Yummy Menu</h2>
            <p className="text-[#7a5d5d]">Pick your favorite dishes, choose quantity, and send your order to Chef Maher.</p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-3 shadow-md">
            <div className="text-xs font-bold uppercase tracking-wide text-[#c27a8b]">Current total</div>
            <div className="text-2xl font-black text-[#ef5d46]">{formatAED(total)}</div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {menuItems.map((item) => {
            const qty = quantities[item.id] || 0;
            return (
              <article key={item.id} className="rounded-[28px] border border-[#ffd1dc] bg-white p-5 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 inline-flex rounded-full bg-[#fff1f5] px-3 py-1 text-xs font-bold text-[#d24e6e]">{item.badge}</div>
                    <h3 className="text-2xl font-black text-[#3c2c2c]">{item.name}</h3>
                  </div>
                  <div className="text-4xl">{item.emoji}</div>
                </div>
                <MenuImageCard image={item.image} emoji={item.emoji} name={item.name} />
                <p className="mb-4 text-sm text-[#7a5d5d]">{item.description}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {item.ingredients.map((ingredient) => (
                    <span key={ingredient} className="rounded-full bg-[#fff6ef] px-3 py-1 text-xs font-semibold text-[#9a6666]">{ingredient}</span>
                  ))}
                </div>

                {item.id === "crepe" && qty > 0 && (
                  <div className="mb-4 rounded-2xl bg-[#fff7f1] p-3">
                    <label className="mb-3 block text-sm font-bold text-[#c95b52]">Pick a topping for each crepe (optional, +3 AED each)</label>
                    <div className="space-y-3">
                      {Array.from({ length: qty }).map((_, index) => (
                        <div key={index}>
                          <label className="mb-1 block text-xs font-bold text-[#9a6666]">Crepe {index + 1}</label>
                          <select value={crepeToppingsSelected[index] || ""} onChange={(e) => updateCrepeTopping(index, e.target.value)} className="w-full rounded-xl border border-[#ffd5cc] bg-white px-3 py-2 text-sm outline-none">
                            <option value="">No topping</option>
                            {crepeToppings.map((topping) => (
                              <option key={topping.id} value={topping.name}>{topping.name} — {formatAED(topping.price)}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.id === "combo-offer" && qty > 0 && (
                  <div className="mb-4 rounded-2xl bg-[#fff7f1] p-3">
                    <label className="mb-2 block text-sm font-bold text-[#c95b52]">Salt & Sweet combo choice</label>
                    <select value={comboChoice} onChange={(e) => setComboChoice(e.target.value)} className="w-full rounded-xl border border-[#ffd5cc] bg-white px-3 py-2 text-sm outline-none">
                      <option value="">Choose your combo</option>
                      <option value="Pasta + Crepe">Pasta + Crepe</option>
                      <option value="Mac & Cheese + Crepe">Mac & Cheese + Crepe</option>
                    </select>
                    <p className="mt-2 text-xs text-[#8b6b6b]">One savory favorite + one sweet crepe. Salt and Sweet, the best of both worlds.</p>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between rounded-2xl bg-[#fff4f7] px-4 py-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[#c27a8b]">Price</div>
                    <div className="text-2xl font-black text-[#ef5d46]">{formatAED(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(item.id, -1)} className="h-10 w-10 rounded-full bg-white text-xl font-black text-[#ef5d46] shadow-sm">−</button>
                    <div className="flex h-10 min-w-[46px] items-center justify-center rounded-full bg-white px-4 text-lg font-black text-[#3c2c2c] shadow-sm">{qty}</div>
                    <button type="button" onClick={() => updateQty(item.id, 1)} className="h-10 w-10 rounded-full bg-[#ef5d46] text-xl font-black text-white shadow-sm">+</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1fr_1fr] md:px-6 md:py-8">
        <div className="rounded-[28px] border border-[#ffd1dc] bg-white p-6 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-[#ef5d46]">Your order summary</h2>
            <p className="text-sm text-[#7a5d5d]">A quick look before you send it to WhatsApp.</p>
          </div>
          {selectedItems.length === 0 ? (
            <div className="rounded-2xl bg-[#fff7f1] p-5 text-center text-[#8b6b6b]">Pick something yummy first 🍓</div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map(({ item, qty }) => (
                <div key={item.id} className="rounded-2xl bg-[#fff7f1] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#3c2c2c]">{item.name}</div>
                      <div className="text-sm text-[#8b6b6b]">Qty: {qty}</div>
                    </div>
                    <div className="font-black text-[#ef5d46]">{formatAED(item.price * qty)}</div>
                  </div>
                  {item.id === "combo-offer" && comboChoice && <div className="mt-2 text-sm text-[#8b6b6b]">Combo choice: {comboChoice}</div>}
                  {item.id === "crepe" && crepeToppingsSelected.filter(Boolean).length > 0 && (
                    <div className="mt-3 border-t border-[#ffd9e2] pt-3 text-sm text-[#8b6b6b]">
                      <div className="mb-1 font-bold text-[#c95b52]">Toppings</div>
                      <div className="space-y-1">
                        {crepeToppingsSelected.map((topping, index) => topping ? <div key={index}>Crepe {index + 1}: {topping}</div> : null)}
                      </div>
                      <div className="mt-2 font-bold text-[#ef5d46]">Add-ons total: {formatAED(toppingPrice)}</div>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#ef5d46] px-5 py-4 text-white">
                <div className="text-lg font-bold">Total</div>
                <div className="text-3xl font-black">{formatAED(total)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-[#ffd1dc] bg-white p-6 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-[#ef5d46]">Delivery details</h2>
            <p className="text-sm text-[#7a5d5d]">This is just for nearby neighbors, so we’re keeping it simple.</p>
          </div>
          <div className="mb-4 rounded-2xl bg-[#fff7f1] px-4 py-3 text-sm font-semibold text-[#c95b52]">🚚 The chef is going to personally deliver your order :)</div>
          <div className="space-y-4">
            <div><label className="mb-2 block text-sm font-bold text-[#7a5d5d]">Customer full name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Type your full name" /></div>
            <div><label className="mb-1 block text-sm font-bold text-[#7a5d5d]">Mobile number</label><p className="mb-2 text-xs text-[#a06d6d]">Trust us, this is not for spam or ads... but mom might use it to contact you :)</p><input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Type your mobile number" /></div>
            <div><label className="mb-2 block text-sm font-bold text-[#7a5d5d]">Building / Villa / House No.</label><input value={house} onChange={(e) => setHouse(e.target.value)} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Example: Villa 14" /></div>
            <div><label className="mb-2 block text-sm font-bold text-[#7a5d5d]">Street / Landmark</label><input value={landmark} onChange={(e) => setLandmark(e.target.value)} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Example: Next to the playground" /></div>
            <div><label className="mb-2 block text-sm font-bold text-[#7a5d5d]">Extra instructions</label><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Tell Chef Maher anything special about your order" /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 md:px-6">
        <div className="rounded-[28px] border border-[#ffd1dc] bg-white p-6 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-[#ef5d46]">Yummy Messages Wall</h2>
            <p className="mx-auto mt-2 max-w-3xl text-[#7a5d5d]">Leave a sweet note or a cheerful voice message for Chef Maher — every kind word adds extra yum.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[24px] bg-[#fff7f1] p-5">
              <div className="space-y-4">
                <div><label className="mb-2 block text-sm font-bold text-[#7a5d5d]">Your name</label><input value={supportName} onChange={(e) => setSupportName(e.target.value)} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Type your name" /></div>
                <div><label className="mb-2 block text-sm font-bold text-[#7a5d5d]">Your yummy message</label><textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} rows={4} className="w-full rounded-2xl border border-[#ffd5cc] bg-white px-4 py-3 text-[#3c2c2c] placeholder:text-[#b08d8d] outline-none focus:border-[#f26a4b]" placeholder="Say something kind, funny, or encouraging for Chef Maher" /></div>
                <div className="rounded-[22px] bg-white p-4 shadow-sm">
                  <div className="mb-3 text-sm font-bold text-[#c95b52]">Optional voice cheer 🎙️</div>
                  <div className="mb-3 flex flex-wrap gap-3">
                    {!isSupportRecording ? <button type="button" onClick={startSupportRecording} className="rounded-full bg-[#ef5d46] px-4 py-3 font-bold text-white shadow-sm">🎙️ Record voice message</button> : <button type="button" onClick={stopSupportRecording} className="rounded-full bg-[#d24e6e] px-4 py-3 font-bold text-white shadow-sm">⏹ Stop recording</button>}
                    {supportAudioUrl && <button type="button" onClick={resetSupportRecording} className="rounded-full bg-[#fff7f1] px-4 py-3 font-bold text-[#ef5d46] shadow-sm">🔁 Re-record</button>}
                  </div>
                  {isSupportRecording && <p className="mb-3 text-sm font-bold text-[#d24e6e]">Recording your cheerful message now 💛</p>}
                  {supportAudioUrl ? <div className="space-y-2"><audio controls src={supportAudioUrl} className="w-full" /><p className="text-sm text-[#7a5d5d]">Voice cheer ready{supportAudioDuration ? ` (${supportAudioDuration}s)` : ""}. It will be sent for review before appearing on the wall.</p></div> : <p className="text-sm text-[#7a5d5d]">No voice message yet — totally optional.</p>}
                </div>
                {supportSuccess && <div className="rounded-2xl bg-[#ecfff2] px-4 py-3 text-sm font-semibold text-[#217846]">{supportSuccess}</div>}
                <button type="button" onClick={submitSupportMessage} disabled={isSubmittingSupport} className="w-full rounded-full bg-[#ef5d46] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70">{isSubmittingSupport ? "Sending your yummy message..." : "💛 Add to the Yummy Messages Wall"}</button>
              </div>
            </div>
            <div className="grid gap-4">
              {supportWallMessages.map((entry) => (
                <div key={entry.id} className="rounded-[24px] border border-[#ffe0e8] bg-gradient-to-br from-white to-[#fff7fb] p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between"><div className="text-lg font-black text-[#3c2c2c]">{entry.name}</div><div className="text-2xl">{entry.emoji}</div></div>
                  <p className="text-[#7a5d5d]">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <div className="rounded-[32px] border-4 border-[#ffb5c8] bg-gradient-to-r from-[#ffe8f0] to-[#ffe6d6] p-6 text-center shadow-[0_20px_60px_rgba(242,106,75,0.18)]">
          <h2 className="text-3xl font-black text-[#ef5d46]">Ready to send your order?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-[#7a5d5d]">Tap the button below and your order will open in WhatsApp, ready to send straight to Chef Maher.</p>
          <div className="mt-6 flex flex-col items-center gap-3"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-8 py-4 text-lg font-black text-white shadow-lg transition hover:scale-[1.02]">💬 Send order on WhatsApp</a><p className="text-xs text-[#7a5d5d]">Test number for now: +971 55 959 5383</p></div>
        </div>
      </section>
    </main>
  );
}
