"""
Yess Bangla — Company Profile (বাংলা সংস্করণ)

Renders an HTML/CSS template with Noto Sans Bengali via headless Chromium,
producing a fully-shaped Bangla A4 PDF that mirrors the English edition's
17-section structure. Headless Chromium uses HarfBuzz so conjuncts
(যেমন প্র, ক্ত, দ্ব) এবং vowel signs render properly.
"""
from __future__ import annotations
import datetime
import json
import os
import shutil
import subprocess
import tempfile

PUBLIC = "/dev-server/public"
LETTERHEAD = f"{PUBLIC}/yess-bangla-letterhead.jpeg"
LH_HEADER = f"{PUBLIC}/letterhead-header.png"
LH_FOOTER = f"{PUBLIC}/letterhead-footer.png"
LH_WATERMARK = f"{PUBLIC}/letterhead-watermark.png"
PDF_OUT = f"{PUBLIC}/yess-bangla-company-profile-bn.pdf"

with open("/dev-server/src/data/company-contact.json", encoding="utf-8") as _f:
    CONTACT = json.load(_f)
PHONE = CONTACT["phone"]["display"]
EMAIL = CONTACT["email"]
WEB = CONTACT["web"]
OFFICE = CONTACT["office"]
CORP = CONTACT["corporateOffice"]

VERSION = "v2.0"
GENERATED_BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন",
                       "জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"]
def _bn_digits(s: str) -> str:
    table = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
    return s.translate(table)
_today = datetime.date.today()
GENERATED_BN = f"{_bn_digits(str(_today.day))} {GENERATED_BN_MONTHS[_today.month-1]} {_bn_digits(str(_today.year))}"
GENERATED_EN = _today.strftime("%d %B %Y")

# ---------------------------------------------------------------------------
# Sections — বাংলা content (mirrors English edition structure)
# ---------------------------------------------------------------------------
SECTIONS = [
    {"n": "০১", "kicker": "ভূমিকা", "title": "ব্যবস্থাপনার পক্ষ থেকে বার্তা",
     "blocks": [
        ("p", "ইয়েস বাংলায় আমরা বিশ্বাস করি, আধুনিক বাংলাদেশ একটি আধুনিক এন্টারপ্রাইজ গ্রুপের যোগ্য — যা আন্তর্জাতিক ব্যবসায়িক শৃঙ্খলার সঙ্গে গভীর স্থানীয় অন্তর্দৃষ্টিকে একত্রিত করে। গত কয়েক বছরে আমরা সফটওয়্যার, ওটিটি স্ট্রিমিং, ডিজিটাল সাংবাদিকতা, আইনি পরামর্শ, অর্গানিক বাণিজ্য, হোস্টিং, অন-ডিম্যান্ড সেবা এবং ইভেন্ট খাতে আটটি সক্রিয় ভেঞ্চার পরিচালনা করছি — এবং স্যাটেলাইট টেলিভিশন, ভ্রমণ, খাদ্য ও ট্যালেন্ট ব্র্যান্ড উন্নয়নাধীন রয়েছে — সবগুলোই আন্তর্জাতিক মানে পরিচালিত হয় এবং একই সাথে আমরা যেসব কমিউনিটিকে সেবা দিই, তাদের শিকড়ে গভীরভাবে প্রোথিত।"),
        ("p", "আমাদের ক্লায়েন্ট, পার্টনার, নিয়ন্ত্রক সংস্থা এবং দর্শকদের প্রতি আমাদের প্রতিশ্রুতি সরল: প্রতিটি লেনদেনে সততা, প্রতিটি পণ্যে নিপুণতা, এবং প্রতিটি সর্বজনীন কাজে দায়বদ্ধতা। আমরা আমাদের মানুষ, আমাদের প্রযুক্তি এবং দীর্ঘমেয়াদি সম্পর্কে বিনিয়োগ করি — কারণ এভাবেই টেকসই কোম্পানি গড়ে ওঠে।"),
        ("p", "আপনি যদি দক্ষিণ এশিয়ায় অংশীদার খুঁজছেন এমন একটি বহুজাতিক প্রতিষ্ঠান হন, কিংবা আপনার পরিচালনা আধুনিকীকরণ করতে চাওয়া বাংলাদেশি এন্টারপ্রাইজ হন, অথবা দীর্ঘমেয়াদি সহযোগিতা বিবেচনা করছেন এমন বিনিয়োগকারী হন — এই দলিল আপনাকে আমাদের পরিচয়, কর্ম এবং মানদণ্ডের সৎ চিত্র উপস্থাপন করবে।"),
        ("sig", "— পরিচালনা পর্ষদ, ইয়েস বাংলা প্রাইভেট লিমিটেড"),
     ]},
    {"n": "০২", "kicker": "গ্রুপ পরিচিতি", "title": "ইয়েস বাংলা সম্পর্কে",
     "blocks": [
        ("p", "ইয়েস বাংলা প্রাইভেট লিমিটেড একটি বাংলাদেশে নিবন্ধিত প্রাইভেট লিমিটেড কোম্পানি, যার সদর দপ্তর ঢাকার মিরপুরে অবস্থিত। গ্রুপটি চারটি কৌশলগত খাতে আটটি সক্রিয় ভেঞ্চার পরিচালনা করে এবং আরও পাঁচটি ব্র্যান্ড উন্নয়নাধীন রয়েছে: প্রযুক্তি ও ডিজিটাল, মিডিয়া ও সংবাদ, বাণিজ্য ও লাইফস্টাইল এবং পেশাদার সেবা।"),
        ("p", "আমরা এন্টারপ্রাইজ ক্লায়েন্ট, সরকারি প্রতিষ্ঠান, ব্রডকাস্টার, বিজ্ঞাপনদাতা এবং ভোক্তাদের জন্য ডিজিটাল পণ্য ও সেবা ডিজাইন, নির্মাণ ও পরিচালনা করি। গ্রুপের সম্মিলিত পরিকাঠামো — ইঞ্জিনিয়ারিং দল, ব্রডকাস্ট সুবিধা, সম্পাদকীয় নিউজরুম, ক্লাউড প্ল্যাটফর্ম, লজিস্টিকস নেটওয়ার্ক এবং ইভেন্ট প্রোডাকশন সক্ষমতা — আমাদের একটি ধারণা থেকে দেশব্যাপী বাস্তবায়ন পর্যন্ত পুরো যাত্রা একই ছাদের নিচে সম্পন্ন করার অস্বাভাবিক ক্ষমতা দেয়।"),
        ("h3", "এক নজরে"),
        ("kv", [
            ("সদর দপ্তর", "ঢাকা, বাংলাদেশ"),
            ("গ্রুপ ভেঞ্চার", "৮টি সক্রিয় · ৫টি উন্নয়নাধীন"),
            ("খাতসমূহ", "প্রযুক্তি · মিডিয়া · বাণিজ্য · সেবা"),
            ("চুক্তি মডেল", "প্রকল্প, রিটেইনার, ম্যানেজড সার্ভিস, অংশীদারিত্ব"),
            ("ব্যাপ্তি", "সারা বাংলাদেশ, এবং ডায়াস্পোরা ও রপ্তানি চ্যানেল"),
            ("ভাষা", "বাংলা · ইংরেজি"),
        ]),
     ]},
    {"n": "০৩", "kicker": "আমরা যা বিশ্বাস করি", "title": "ভিশন, মিশন ও মূলবোধ",
     "blocks": [
        ("h3", "ভিশন"),
        ("p", "দক্ষিণ এশিয়ার সবচেয়ে বিশ্বস্ত সমন্বিত এন্টারপ্রাইজ গ্রুপ হয়ে ওঠা — এমন পণ্য, মিডিয়া ও সেবা তৈরি করা যা প্রতিদিনের জীবনকে উন্নত করে এবং বাংলাদেশি কারিগরির জন্য আন্তর্জাতিক সম্মান অর্জন করে।"),
        ("h3", "মিশন"),
        ("ul", [
            "বাংলাদেশি ক্লায়েন্ট ও দর্শকদের কাছে বিশ্বমানের প্রযুক্তি ও মিডিয়া পৌঁছে দেওয়া।",
            "প্রতিটি ভেঞ্চার সম্পূর্ণ আইনি, নৈতিক ও সম্পাদকীয় সততায় পরিচালনা করা।",
            "আমাদের মানুষ, প্রক্রিয়া ও প্ল্যাটফর্মে নিরন্তর বিনিয়োগ করা।",
            "ক্লায়েন্ট, কর্মী, পার্টনার ও শেয়ারহোল্ডারদের জন্য টেকসই অর্থনৈতিক মূল্য সৃষ্টি করা।",
        ]),
        ("h3", "মূলবোধ"),
        ("dl", [
            ("সততা", "আমরা যা বলি তাই বুঝাই, যা প্রতিশ্রুতি দিই তা পৌঁছে দিই, এবং যা জানি তা প্রকাশ করি।"),
            ("নিপুণতা", "ইঞ্জিনিয়ারিং, সাংবাদিকতা ও ডিজাইনে নিজেদের আন্তর্জাতিক মানের সঙ্গে বেঁধে রাখি।"),
            ("দায়বদ্ধতা", "প্রতিটি সর্বজনীন সিদ্ধান্তের সামাজিক ও সম্পাদকীয় পরিণতি বিবেচনা করি।"),
            ("সেবা", "ক্লায়েন্ট, দর্শক ও পার্টনার আমাদের প্রতিটি পরিচালনাগত সিদ্ধান্তের কেন্দ্রে।"),
            ("উদ্ভাবন", "শৃঙ্খলাবদ্ধ পরীক্ষা-নিরীক্ষাকে সমর্থন করি, কেবল স্লোগানকে নয়।"),
        ]),
     ]},
    {"n": "০৪", "kicker": "গ্রুপের কাঠামো", "title": "করপোরেট স্ট্রাকচার",
     "blocks": [
        ("p", "ইয়েস বাংলা প্রাইভেট লিমিটেড মূল হোল্ডিং কোম্পানি। প্রতিটি ভেঞ্চার নিজস্ব ব্র্যান্ড, নেতৃত্ব, লাভ-ক্ষতি ও পণ্য রোডম্যাপ নিয়ে স্বতন্ত্র ব্যবসায়িক একক হিসেবে পরিচালিত হয়, এবং একই সঙ্গে গ্রুপ পর্যায়ে অর্থ, এইচআর, আইনি, পরিকাঠামো ও ব্র্যান্ড গভর্নেন্সের কেন্দ্রীয় ফাংশনগুলো ভাগ করে নেয়।"),
        ("table", {"head": ["খাত", "ভেঞ্চার", "ভূমিকা"], "rows": [
            ["প্রযুক্তি ও ডিজিটাল", "ইয়েস সফট · ইয়েস হোস্ট · সন্ধান", "সফটওয়্যার ইঞ্জিনিয়ারিং, ওয়েব/মোবাইল, ইআরপি/সিআরএম, ক্লাউড হোস্টিং, সার্ভিস মার্কেটপ্লেস"],
            ["মিডিয়া ও সংবাদ", "আকাশ ওটিটি · দ্য ডেইলি আকাশ · আকাশ টিভি (আসছে)", "ওটিটি স্ট্রিমিং, ডিজিটাল সংবাদপত্র, স্যাটেলাইট টিভি (উন্নয়নাধীন)"],
            ["বাণিজ্য ও লাইফস্টাইল", "ইয়েস অর্গানিক হাট · ইয়েস ট্যুরিজম (আসছে) · ইয়েস ফুড (আসছে)", "অর্গানিক মার্কেটপ্লেস, কিউরেটেড ভ্রমণ, খাদ্য"],
            ["পেশাদার সেবা", "ইয়েস লিগ্যাল অ্যাডভাইস · ইয়েস ইভেন্ট · ইয়েস মডেল (আসছে)", "আইনি পরামর্শ, ইভেন্ট ম্যানেজমেন্ট, ট্যালেন্ট এজেন্সি"],
        ]}),
     ]},
    {"n": "০৫", "kicker": "আটটি সক্রিয় ব্র্যান্ড, আরও পাঁচটি আসছে", "title": "ব্যবসায়িক বিভাগ ও ভেঞ্চার",
     "blocks": [
        ("p", "প্রতিটি ইয়েস বাংলা ভেঞ্চার একটি স্বতন্ত্র ব্র্যান্ড, যার নিজস্ব ক্লায়েন্ট, পণ্য ও রোডম্যাপ রয়েছে। একসঙ্গে এরা একটি সমন্বিত পোর্টফোলিও গঠন করে, যা প্রায় যেকোনো আধুনিক ব্যবসায়িক বা ভোক্তা প্রয়োজন মেটাতে সক্ষম। বর্তমানে আটটি ব্র্যান্ড সক্রিয়; আরও পাঁচটি উন্নয়নাধীন।"),
        ("dl", [
            ("ইয়েস সফট — সফটওয়্যার ও আইটি সমাধান", "কাস্টম সফটওয়্যার, ওয়েব ও মোবাইল অ্যাপ, ইআরপি, সিআরএম এবং এন্টারপ্রাইজ সিস্টেম, যা বাংলাদেশ ও তার বাইরের আধুনিক ব্যবসার জন্য নির্মিত।"),
            ("সন্ধান — অন-ডিম্যান্ড হোম ও পেশাদার সেবা", "বাংলাদেশের বিশ্বস্ত অন-ডিম্যান্ড সার্ভিস প্ল্যাটফর্ম, যা যাচাইকৃত ইলেকট্রিশিয়ান, প্লাম্বার, টেকনিশিয়ান, ক্লিনার ও টিউটরদের পরিবার ও ব্যবসার সাথে সংযুক্ত করে — সেবার গ্যারান্টি ও তাৎক্ষণিক ডিজিটাল বুকিংসহ।"),
            ("আকাশ ওটিটি — স্ট্রিমিং প্ল্যাটফর্ম", "একটি মাল্টি-ডিভাইস স্ট্রিমিং সেবা, যা বিশ্বব্যাপী বাংলাদেশি দর্শকদের জন্য অন-ডিম্যান্ড বিনোদন, অরিজিনাল, লাইভ চ্যানেল ও কিউরেটেড ক্যাটালগ অফার করে।"),
            ("দ্য ডেইলি আকাশ — ডিজিটাল সংবাদপত্র", "একটি স্বাধীন, ডিজিটাল-ফার্স্ট জাতীয় দৈনিক, যা যাচাইকৃত সাংবাদিকতা ও মৌলিক প্রতিবেদনের মাধ্যমে রাজনীতি, ব্যবসা, খেলা, সংস্কৃতি ও প্রযুক্তি কভার করে।"),
            ("ইয়েস লিগ্যাল অ্যাডভাইস — আইনি ও ব্যবসায়িক পরামর্শ", "ব্যক্তি, স্টার্টআপ ও এন্টারপ্রাইজের জন্য সহজলভ্য আইনি পরামর্শ — যোগ্যতাসম্পন্ন কাউন্সেলের কাছ থেকে কোম্পানি গঠন, চুক্তি, কমপ্লায়েন্স ও বিরোধ নিষ্পত্তি সহায়তা।"),
            ("ইয়েস অর্গানিক হাট — অর্গানিক মার্কেটপ্লেস", "একটি ডিরেক্ট-টু-কনজিউমার অর্গানিক মার্কেটপ্লেস, যা যাচাইকৃত বাংলাদেশি কৃষকদের সাথে শহুরে পরিবারগুলোকে কোল্ড-চেইন লজিস্টিকস ও মান নিশ্চয়তার মাধ্যমে সংযুক্ত করে।"),
                        ("ইয়েস হোস্ট — হোস্টিং ও ক্লাউড পরিকাঠামো", "ম্যানেজড শেয়ারড, ভিপিএস, ক্লাউড ও ডেডিকেটেড হোস্টিং, স্থানীয় ডেটা রেসিডেন্সি, ২৪/৭ মনিটরিং ও এন্টারপ্রাইজ-গ্রেড নিরাপত্তা সহ।"),
            ("ইয়েস ইভেন্ট — ইভেন্ট ম্যানেজমেন্ট", "করপোরেট লঞ্চ, সম্মেলন, ব্রডকাস্ট ইভেন্ট, বিবাহ এবং সরকারি অনুষ্ঠানের জন্য পূর্ণ সেবা ইভেন্ট প্রোডাকশন।"),
        ]),
        ("pagebreak", None),
        ("h3", "আসন্ন ব্র্যান্ড — উন্নয়নাধীন"),
        ("dl", [
            ("আকাশ টিভি — স্যাটেলাইট টেলিভিশন", "উন্নয়নাধীন একটি বাংলা ভাষার স্যাটেলাইট চ্যানেল, যা লক্ষ লক্ষ দর্শকের কাছে সংবাদ, বিনোদন, টক শো ও সাংস্কৃতিক অনুষ্ঠান পৌঁছে দেবে।"),
            ("ইয়েস ট্যুরিজম — ভ্রমণ ও আতিথেয়তা", "স্বচ্ছ মূল্য, গাইডেড অভিজ্ঞতা ও ডোরস্টেপ সেবাসহ কিউরেটেড দেশি-বিদেশি ভ্রমণ প্যাকেজ।"),
            ("ইয়েস মডেল — মডেলিং ও ট্যালেন্ট এজেন্সি", "একটি ট্যালেন্ট এজেন্সি, যা বিজ্ঞাপন, ব্রডকাস্ট, ফ্যাশন ও ডিজিটাল ক্যাম্পেইনে মডেল, উপস্থাপক ও ক্রিয়েটরদের প্রতিনিধিত্ব করে।"),
            ("ইয়েস ফুড — খাদ্য ও পানীয়", "একটি খাদ্য ব্র্যান্ড, যা কঠোর মান ও স্বাস্থ্যবিধি নিশ্চিত করে আধুনিক আউটলেট ও প্যাকেজড ফরম্যাটে খাঁটি বাংলাদেশি স্বাদ নিয়ে আসে।"),
            ("ইয়েস অল ইন ওয়ান সলিউশন — সমন্বিত ব্যবসায়িক সমাধান", "যেসব ক্লায়েন্ট একাধিক ইয়েস বাংলা সেবা একটি সমন্বিত কর্মসূচিতে একত্রিত করতে চান, তাদের জন্য একক যোগাযোগ বিন্দু।"),
        ]),
     ]},
    {"n": "০৬", "kicker": "আমরা যা সরবরাহ করি", "title": "সক্ষমতা ও সেবার পরিধি",
     "blocks": [
        ("dl", [
            ("সফটওয়্যার ইঞ্জিনিয়ারিং", "কাস্টম এন্টারপ্রাইজ সফটওয়্যার, ইআরপি, সিআরএম, ই-কমার্স, ফিনটেক, এডটেক এবং বেসপোক ওয়েব/মোবাইল অ্যাপ।"),
            ("অন-ডিম্যান্ড সেবা", "যাচাইকৃত হোম ও ব্যবসায়িক সেবা, ডিজিটাল বুকিং, সেবার গ্যারান্টি ও কর্মশক্তির মান নিশ্চয়তা।"),
            ("ডিজিটাল স্ট্রিমিং", "ওটিটি প্ল্যাটফর্ম ইঞ্জিনিয়ারিং, কন্টেন্ট প্যাকেজিং, ডিআরএম, মনিটাইজেশন, মাল্টি-ডিভাইস প্লেব্যাক ও সাবস্ক্রাইবার অপারেশন।"),
            ("সম্পাদকীয় ও সাংবাদিকতা", "জাতীয় ডিজিটাল নিউজরুম, অনুসন্ধানী প্রতিবেদন, মাল্টিমিডিয়া স্টোরিটেলিং এবং আন্তর্জাতিক প্রেস কোডের সাথে সঙ্গতিপূর্ণ সম্পাদকীয় মান।"),
            ("ক্লাউড ও পরিকাঠামো", "ম্যানেজড হোস্টিং, ক্লাউড আর্কিটেকচার, ডেভঅপস, সাইবার নিরাপত্তা, এসএলএ-সমর্থিত মনিটরিং ও দুর্যোগ পুনরুদ্ধার।"),
            ("ই-কমার্স ও লজিস্টিকস", "ডিরেক্ট-টু-কনজিউমার মার্কেটপ্লেস, সাপ্লায়ার অনবোর্ডিং, কোল্ড-চেইন হ্যান্ডলিং, লাস্ট-মাইল ডেলিভারি ও ডিজিটাল পেমেন্ট।"),
            ("পেশাদার ও আইনি সেবা", "আইনি পরামর্শ, ইভেন্ট প্রোডাকশন, ট্যালেন্ট ম্যানেজমেন্ট এবং সমন্বিত ক্রস-ভেঞ্চার কর্মসূচি।"),
            ("ব্র্যান্ড, ডিজাইন ও কন্টেন্ট", "আইডেন্টিটি সিস্টেম, আর্ট ডিরেকশন, ফটোগ্রাফি, ভিডিও, মোশন গ্রাফিক্স এবং আর্নড ও পেইড মিডিয়া জুড়ে সমন্বিত ক্যাম্পেইন।"),
        ]),
     ]},
    {"n": "০৭", "kicker": "আমরা কীভাবে নির্মাণ ও পরিচালনা করি", "title": "প্রযুক্তি ও মান নিয়ন্ত্রণ",
     "blocks": [
        ("p", "আমরা আন্তর্জাতিক মানে নির্মাণ ও পরিচালনা করি। আমাদের প্ল্যাটফর্মগুলো আধুনিক, সমর্থিত প্রযুক্তির উপর নির্মিত — ডকুমেন্টেড আর্কিটেকচার, স্বয়ংক্রিয় টেস্টিং, কোড রিভিউ ও কন্টিনিউয়াস ডিপ্লয়মেন্ট সহ। আমাদের ব্রডকাস্ট ও সম্পাদকীয় কার্যক্রম নির্ভুলতা, ন্যায্যতা ও সূত্র সুরক্ষার জন্য আন্তর্জাতিকভাবে স্বীকৃত কোড অনুসরণ করে।"),
        ("h3", "ইঞ্জিনিয়ারিং"),
        ("ul", [
            "টাইপস্ক্রিপ্ট / নোড.জেএস · রিঅ্যাক্ট · নেক্সট.জেএস · ট্যানস্ট্যাক · টেইলউইন্ড — পণ্য ইঞ্জিনিয়ারিং-এর জন্য।",
            "পোস্টগ্রেএসকিউএল · রেডিস · এস৩-সমর্থিত স্টোরেজ · সার্ভারলেস ও কনটেইনার ওয়ার্কলোড।",
            "ক্লাউড-নেটিভ ডিপ্লয়মেন্ট: এডব্লিউএস, জিসিপি ও অন-প্রিম, ইনফ্রাস্ট্রাকচার-অ্যাজ-কোড সহ।",
            "বাধ্যতামূলক কোড রিভিউ, ইউনিট + ইন্টিগ্রেশন টেস্ট, অ্যাক্সেসিবিলিটি (WCAG 2.2 AA) এবং লাইটহাউস পারফরম্যান্স বাজেট।",
            "নিরাপত্তা: OWASP ASVS-সমর্থিত রিভিউ, সিক্রেট ম্যানেজমেন্ট, RBAC এবং অডিটেড অ্যাক্সেস লগ।",
        ]),
        ("h3", "ব্রডকাস্ট ও সম্পাদকীয়"),
        ("ul", [
            "আন্তর্জাতিকভাবে স্বীকৃত প্রেস কোডের ভিত্তিতে সম্পাদকীয় মান।",
            "মৌলিক প্রতিবেদনের জন্য দ্বি-সূত্র যাচাই নীতি; সংশোধনী স্বচ্ছতার সাথে প্রকাশ।",
            "সংবেদনশীল প্রতিবেদনের জন্য সূত্র সুরক্ষা, অবদানকারীর নিরাপত্তা এবং অন-কল আইনি পর্যালোচনা।",
            "ব্রডকাস্ট প্রযুক্তিগত মান: এইচডি ইনজেস্ট, রিডান্ড্যান্ট প্লেআউট, প্রযোজ্য ক্ষেত্রে ক্যাপশনযুক্ত কন্টেন্ট।",
        ]),
        ("h3", "পরিচালনা"),
        ("ul", [
            "অর্থ, এইচআর, আইটি ও সম্পাদকীয় জুড়ে ডকুমেন্টেড স্ট্যান্ডার্ড অপারেটিং প্রসিডিউর।",
            "ত্রৈমাসিক অভ্যন্তরীণ পর্যালোচনা ও ক্রমাগত উন্নতির চক্র।",
            "সকল গুরুত্বপূর্ণ পক্ষের জন্য ভেন্ডর ডিউ-ডিলিজেন্স ও কেওয়াইসি।",
        ]),
     ]},
    {"n": "০৮", "kicker": "আমরা যাদের সেবা দিই", "title": "ক্লায়েন্ট, দর্শক ও বাজার ব্যাপ্তি",
     "blocks": [
        ("p", "আমাদের ক্লায়েন্ট ও দর্শকরা এন্টারপ্রাইজ, সরকারি, এসএমই, ভোক্তা ও ডায়াস্পোরা — সব সেগমেন্টেই বিস্তৃত। সম্মিলিত ইয়েস বাংলা ইকোসিস্টেম প্রতিদিন বাংলাদেশের প্রতিটি প্রধান বিভাগে এবং বাংলাভাষী ডায়াস্পোরা জুড়ে দর্শক, পাঠক, ক্রেতা ও পেশাজীবীদের কাছে পৌঁছায়।"),
        ("table", {"head": ["সেগমেন্ট", "উদাহরণ", "চুক্তি ধরন"], "rows": [
            ["এন্টারপ্রাইজ", "ব্যাংক, টেলকো, উৎপাদনকারী, কনগ্লোমারেট", "কাস্টম প্ল্যাটফর্ম, ম্যানেজড সার্ভিস, রিটেইনার"],
            ["সরকার ও এনজিও", "সরকারি সংস্থা, উন্নয়ন পার্টনার", "আরএফপি ডেলিভারি, সিভিক মিডিয়া, পরিকাঠামো"],
            ["এসএমই ও স্টার্টআপ", "বৃদ্ধিশীল বাংলাদেশি ব্যবসা", "ওয়েব, মোবাইল, হোস্টিং, ব্র্যান্ড, কন্টেন্ট"],
            ["ভোক্তা", "শহুরে ও আধা-শহুরে পরিবার", "ওটিটি, সংবাদ, অর্গানিক পণ্য, অন-ডিম্যান্ড সেবা"],
            ["বিজ্ঞাপনদাতা", "স্থানীয় ও বৈশ্বিক ব্র্যান্ড", "আকাশ ওটিটি ও দ্য ডেইলি আকাশে ডিজিটাল মিডিয়া ইনভেন্টরি"],
        ]}),
     ]},
    {"n": "০৯", "kicker": "আমাদের যাত্রা", "title": "ট্র্যাক রেকর্ড ও মাইলফলক",
     "blocks": [
        ("dl", [
            ("প্রতিষ্ঠা", "একটি সমন্বিত বাংলাদেশি এন্টারপ্রাইজ গ্রুপ গঠনের দীর্ঘমেয়াদি ভিশন নিয়ে ঢাকায় ইয়েস বাংলা প্রাইভেট লিমিটেড নিবন্ধিত হয়।"),
            ("প্রযুক্তি সূচনা", "বাংলাদেশি ক্লায়েন্টদের কাছে এন্টারপ্রাইজ সফটওয়্যার ও ম্যানেজড হোস্টিং সরবরাহের জন্য ইয়েস সফট ও ইয়েস হোস্ট প্রতিষ্ঠিত হয়।"),
            ("মিডিয়া সম্প্রসারণ", "আকাশ ওটিটি স্ট্রিমিং প্ল্যাটফর্ম ও দ্য ডেইলি আকাশ ডিজিটাল সংবাদপত্র চালু হয়; আকাশ টিভি স্যাটেলাইট চ্যানেল উন্নয়ন পর্যায়ে প্রবেশ করে।"),
            ("বাণিজ্য ও লাইফস্টাইল", "শহুরে পরিবারের কাছে যাচাইকৃত অর্গানিক পণ্য পৌঁছে দিতে ইয়েস অর্গানিক হাট চালু হয়; ইয়েস ট্যুরিজম, ইয়েস ফুড ও ইয়েস মডেল উন্নয়নাধীন রয়েছে।"),
            ("সেবা নেটওয়ার্ক", "সারা বাংলাদেশে অন-ডিম্যান্ড সেবা, ইভেন্ট ও আইনি পরামর্শ সরবরাহের জন্য সন্ধান, ইয়েস ইভেন্ট ও ইয়েস লিগ্যাল অ্যাডভাইস চালু করা হয়।"),
            ("গ্রুপ একীভূতকরণ", "অর্থ, আইটি, আইনি ও এইচআর-এ যৌথ মান সহ একটি একক ব্র্যান্ড গভর্নেন্স কাঠামোর অধীনে সকল ভেঞ্চার একীভূত হয়।"),
        ]),
     ]},
    {"n": "১০", "kicker": "পরিচালনার মূলনীতি হিসেবে দায়িত্ব", "title": "করপোরেট সামাজিক দায়বদ্ধতা",
     "blocks": [
        ("p", "ইয়েস বাংলা দায়িত্বশীল ব্যবসাকে একটি মূল পরিচালনাগত নীতি হিসেবে দেখে — পরবর্তী চিন্তা হিসেবে নয়। আমরা গ্রুপের আয়ের একটি অংশ দীর্ঘমেয়াদি কর্মসূচিতে বিনিয়োগ করি, যা আমরা যেসব কমিউনিটিকে সেবা দিই তাদের শক্তিশালী করে।"),
        ("dl", [
            ("ডিজিটাল সাক্ষরতা", "শিক্ষার্থী, নারী উদ্যোক্তা ও ছোট ব্যবসার মালিকদের ডিজিটাল টুল গ্রহণে সহায়তার জন্য বিনামূল্যে কর্মশালা ও প্রশিক্ষণ উপকরণ।"),
            ("জনস্বার্থ সাংবাদিকতা", "দ্য ডেইলি আকাশ ও আকাশ ওটিটি জাতীয় গুরুত্বের কম-প্রতিবেদনকৃত গল্পের জন্য কলাম স্থান ও স্ক্রিন টাইম বরাদ্দ রাখে।"),
            ("কৃষকের জীবিকা", "ইয়েস অর্গানিক হাট ক্ষুদ্র কৃষকদের সাথে সরাসরি কাজ করে, স্বচ্ছ মূল্য পরিশোধ করে এবং কোল্ড-চেইন প্রশিক্ষণে বিনিয়োগ করে।"),
            ("কর্মী অন্তর্ভুক্তি", "সম-সুযোগ নিয়োগ, কর্মক্ষেত্রে প্রশিক্ষণ এবং রাজধানীর বাইরের নবীন গ্র্যাজুয়েটদের জন্য পথপ্রদর্শন।"),
            ("পরিবেশ", "জ্বালানি-সাশ্রয়ী পরিকাঠামো, কাগজবিহীন পরিচালনা এবং সাপ্লাই চেইন জুড়ে একক-ব্যবহার্য প্যাকেজিং সক্রিয়ভাবে হ্রাস।"),
        ]),
     ]},
    {"n": "১১", "kicker": "যে মানদণ্ড আমরা মেনে চলি", "title": "কমপ্লায়েন্স, গভর্নেন্স ও গোপনীয়তা",
     "blocks": [
        ("h3", "করপোরেট গভর্নেন্স"),
        ("ul", [
            "আনুষ্ঠানিকভাবে ডকুমেন্টেড ভূমিকা ও সভার নিয়মিততা সহ পরিচালনা পর্ষদ।",
            "একটি স্বাধীন চার্টার্ড অ্যাকাউন্ট্যান্সি ফার্ম দ্বারা বার্ষিক বিধিবদ্ধ অডিট।",
            "স্বার্থ-সংঘাত, ঘুষবিরোধী এবং উপহার ও আতিথেয়তা নীতি।",
            "অসদাচরণের গোপনীয় প্রতিবেদনের জন্য হুইসেলব্লোয়ার চ্যানেল।",
        ]),
        ("h3", "নিয়ন্ত্রক সম্মতি"),
        ("ul", [
            "যৌথ স্টক কোম্পানি ও ফার্মস (RJSC), বাংলাদেশে নিবন্ধিত।",
            "কর-নিবন্ধিত (টিআইএন, ভ্যাট) এবং বার্ষিক ফাইলিং বাধ্যবাধকতা পালনকারী।",
            "ব্রডকাস্ট কার্যক্রম প্রাসঙ্গিক জাতীয় কর্তৃপক্ষের লাইসেন্সিং ও কন্টেন্ট নিয়ম মেনে চলে।",
            "সম্পাদকীয় কন্টেন্ট বাংলাদেশ প্রেস কাউন্সিলের আচরণবিধি মেনে চলে।",
        ]),
        ("h3", "ডেটা সুরক্ষা ও গোপনীয়তা"),
        ("ul", [
            "অ্যাক্সেস, স্টোরেজ ও ঘটনা প্রতিক্রিয়া কভার করে ডকুমেন্টেড তথ্য-নিরাপত্তা নীতি।",
            "সকল ক্লায়েন্ট চুক্তির জন্য পারস্পরিক এনডিএ; স্পষ্ট সম্মতি ছাড়া ক্লায়েন্ট ডেটা অভ্যন্তরীণ প্রশিক্ষণে ব্যবহার হয় না।",
            "সংশোধন ও ডেটা-অপসারণ অনুরোধ একটি নামযুক্ত ডেটা প্রোটেকশন কন্ট্যাক্ট দ্বারা পরিচালিত হয়।",
        ]),
     ]},
    {"n": "১২", "kicker": "আমাদের নেতৃত্ব", "title": "নেতৃত্ব দল",
     "blocks": [
        ("p", "গ্রুপটি একটি ছোট, জবাবদিহিমূলক নির্বাহী দলের নেতৃত্বে পরিচালিত হয়, যারা ভেঞ্চার-পর্যায়ের ব্যবস্থাপনা পরিচালক এবং অর্থ, পরিচালনা, প্রযুক্তি, সম্পাদকীয় ও ব্র্যান্ডের ফাংশনাল প্রধানদের দ্বারা সমর্থিত।"),
        ("table", {"head": ["ভূমিকা", "দায়িত্ব"], "rows": [
            ["পরিচালনা পর্ষদ", "কৌশল, পুঁজি বরাদ্দ, গভর্নেন্স, ঝুঁকি তত্ত্বাবধান"],
            ["গ্রুপ ম্যানেজিং ডিরেক্টর", "পরিচালনাগত কর্মক্ষমতা ও ক্রস-ভেঞ্চার সমন্বয়"],
            ["চিফ অপারেটিং অফিসার", "দৈনন্দিন পরিচালনা, এসএলএ, ভেন্ডর ব্যবস্থাপনা"],
            ["চিফ টেকনোলজি অফিসার", "ইঞ্জিনিয়ারিং মান, নিরাপত্তা, প্ল্যাটফর্ম রোডম্যাপ"],
            ["সম্পাদক-ইন-চিফ (মিডিয়া)", "আকাশ ওটিটি ও দ্য ডেইলি আকাশ জুড়ে সম্পাদকীয় সততা"],
            ["অর্থ প্রধান", "ট্রেজারি, অডিট, বিধিবদ্ধ সম্মতি"],
            ["মানব সম্পদ ও কালচার প্রধান", "নিয়োগ, প্রশিক্ষণ, কল্যাণ, বৈচিত্র্য"],
            ["ব্র্যান্ড ও যোগাযোগ প্রধান", "গ্রুপ পরিচয়, পিআর, পার্টনারশিপ মার্কেটিং"],
        ]}),
        ("p", "নামযুক্ত কর্মকর্তাদের বিস্তারিত জীবনবৃত্তান্ত পারস্পরিক এনডিএ সাপেক্ষে অনুরোধে পাওয়া যাবে।"),
     ]},
    {"n": "১৩", "kicker": "আমাদের পার্থক্য", "title": "কেন ইয়েস বাংলা",
     "blocks": [
        ("dl", [
            ("এক পার্টনার, বহু সক্ষমতা", "সফটওয়্যার, ওটিটি, সাংবাদিকতা, আইনি পরামর্শ, ই-কমার্স, হোস্টিং, সেবা ও ইভেন্ট — একটি ব্র্যান্ড ও চুক্তি কাঠামোর অধীনে।"),
            ("স্থানীয় গভীরতা, আন্তর্জাতিক মান", "গভীর বাংলাদেশি বাজার জ্ঞান, আন্তর্জাতিকভাবে স্বীকৃত ইঞ্জিনিয়ারিং, সম্পাদকীয় ও পরিচালনাগত অনুশীলনের সাথে সম্মিলিত।"),
            ("জবাবদিহি গভর্নেন্স", "ডকুমেন্টেড নীতি, বিধিবদ্ধ অডিট, নামযুক্ত ফাংশনাল লিড এবং নিয়মিত মিলিত পর্ষদ।"),
            ("সম্পূর্ণ ডেলিভারি", "ডিসকভারি ও আর্কিটেকচার থেকে বিল্ড, লঞ্চ, পরিচালনা ও ক্রমাগত উন্নতি — সবই অভ্যন্তরীণভাবে।"),
            ("দীর্ঘমেয়াদি সম্পর্ক", "আমরা স্থায়িত্বের জন্য ডিজাইন করি — ক্লায়েন্ট, কর্মী ও পার্টনার আমাদের সাথে থাকেন কারণ আমরা সম্পর্ককেই পণ্য হিসেবে দেখি।"),
        ]),
     ]},
    {"n": "১৪", "kicker": "আমাদের সাথে কথা বলুন", "title": "যোগাযোগ ও চুক্তি",
     "blocks": [
        ("p", "আমরা এন্টারপ্রাইজ ক্লায়েন্ট, সরকারি ও উন্নয়ন পার্টনার, বিজ্ঞাপনদাতা, বিনিয়োগকারী ও সম্ভাব্য কর্মচারীদের কাছ থেকে অনুসন্ধানকে স্বাগত জানাই। প্রাথমিক আলোচনা গোপনীয় ও বাধ্যবাধকতাহীন।"),
        ("h3", "ইয়েস বাংলা প্রাইভেট লিমিটেড"),
        ("kv", [
            ("অফিস", OFFICE),
            ("করপোরেট অফিস", CORP),
            ("সেল", PHONE),
            ("ইমেইল", EMAIL),
            ("ওয়েব", WEB),
        ]),
        ("p", "<i>এই দলিল ইয়েস বাংলা প্রাইভেট লিমিটেডের সম্পত্তি। এটি কেবল মূল্যায়নের উদ্দেশ্যে গোপনীয়তার সাথে প্রদান করা হয়েছে এবং পূর্ব লিখিত সম্মতি ছাড়া পুরো বা আংশিক পুনরুৎপাদন, পুনর্বিতরণ বা উদ্ধৃত করা যাবে না।</i>"),
     ]},
]

# ---------------------------------------------------------------------------
# HTML / CSS template — A4 portrait, full letterhead background per page
# ---------------------------------------------------------------------------
def _render_block(kind, payload):
    """Render a single content block (no pagebreak handling)."""
    if kind == "p":
        return f"<p>{payload}</p>"
    if kind == "h3":
        return f"<h3>{payload}</h3>"
    if kind == "ul":
        items = "".join(f"<li>{x}</li>" for x in payload)
        return f"<ul>{items}</ul>"
    if kind == "dl":
        rows = "".join(
            f"<div class='dl-row'><dt>{k}</dt><dd>{v}</dd></div>"
            for k, v in payload)
        return f"<dl>{rows}</dl>"
    if kind == "kv":
        rows = "".join(
            f"<div class='kv-row'><div class='kv-k'>{k}</div><div class='kv-v'>{v}</div></div>"
            for k, v in payload)
        return f"<div class='kv'>{rows}</div>"
    if kind == "table":
        head = "".join(f"<th>{h}</th>" for h in payload["head"])
        body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>"
                       for r in payload["rows"])
        return f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"
    if kind == "sig":
        return f"<p class='sig'>{payload}</p>"
    return ""


def _render_section(s):
    """Render one section as a flowing block; Playwright + @page margins
    repeat the letterhead header/footer on every sheet automatically."""
    head = f"""
      <header class="sec-head">
        <div class="sec-chip">{s['n']}</div>
        <div class="sec-titles">
          <p class="sec-kicker">{s['kicker']}</p>
          <h2 class="sec-title">{s['title']}</h2>
        </div>
      </header>
      <div class="sec-rule"></div>
    """
    parts = [head, "<div class='sec-body'>"]
    for kind, payload in s['blocks']:
        if kind == "pagebreak":
            parts.append("</div><div class='page-break'></div><div class='sec-body'>")
        else:
            parts.append(_render_block(kind, payload))
    parts.append("</div>")
    return f"<section class='profile-section'>{''.join(parts)}</section>"


def render_html() -> str:
    sections_html = [_render_section(s) for s in SECTIONS]

    # (per-section full-bleed overlay disabled — caused logo overlap with
    # body content after page breaks in Chromium print rendering. The fixed
    # .page-bg layer at opacity 0.55 provides a balanced watermark instead.)

    toc_items = "".join(
        f"<li><span class='toc-num'>{s['n']}</span>"
        f"<span class='toc-title'>{s['title']}</span></li>"
        for s in SECTIONS)

    return f"""<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>ইয়েস বাংলা — কোম্পানি প্রোফাইল ({VERSION})</title>
<style>
  /* Flowing layout — Playwright handles per-page header/footer via
     printOptions, so content here only worries about typography & rhythm. */
  :root {{
    --navy: #0E2A3A;
    --teal: #0F4C5C;
    --gold: #C9A24A;
    --ink: #1A1A1A;
    --muted: #5A5A5A;
    --rule: #D6D9DC;
  }}
  * {{ box-sizing: border-box; }}
  html, body {{
    margin: 0; padding: 0; background: #fff;
    font-family: 'Noto Sans Bengali', 'Noto Serif Bengali', 'Noto Sans', sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    letter-spacing: 0.005em;
    color: var(--ink);
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  }}
  p {{ margin: 0 0 8pt 0; text-align: justify; text-justify: inter-word; hyphens: none; }}
  h2, h3, h4 {{ font-weight: 700; color: var(--navy); margin: 0; line-height: 1.25; letter-spacing: -0.005em; }}
  ul, ol {{ padding-left: 18pt; margin: 0 0 8pt 0; }}
  li {{ margin-bottom: 4pt; line-height: 1.65; }}
  b, strong {{ font-weight: 700; color: var(--navy); }}

  /* Section-level page break — Playwright respects these */
  .cover, .toc, .profile-section {{ page-break-after: always; break-after: page; }}
  .profile-section:last-of-type {{ page-break-after: auto; break-after: auto; }}
  .page-break {{ page-break-after: always; break-after: page; height: 0; }}

  /* Avoid breaking inside small content units */
  .sec-head, .kv-row, .dl-row, table, tr {{ page-break-inside: avoid; break-inside: avoid; }}
  h2, h3 {{ page-break-after: avoid; break-after: avoid; }}

  /* Cover */
  .cover .eyebrow {{
    color: var(--gold); font-weight: 700; font-size: 9pt;
    letter-spacing: 0.14em; margin-bottom: 10pt;
  }}
  .cover h1 {{
    font-size: 40pt; line-height: 1.08; color: var(--navy);
    margin: 0 0 10pt 0; font-weight: 800; letter-spacing: -0.012em;
  }}
  .cover .subtitle {{
    font-size: 13pt; line-height: 1.55; margin: 0 0 18pt 0;
    color: #2c3e50; max-width: 165mm;
  }}
  .strip {{
    background: var(--navy); color: #fff; font-size: 9pt;
    padding: 9pt 14pt; margin-bottom: 14mm; letter-spacing: 0.02em;
  }}
  .glance {{
    border: 0.5pt solid var(--rule);
    border-top: 2.5pt solid var(--gold);
    background: #fff; padding: 16pt 18pt;
  }}

  /* TOC */
  .toc h2 {{
    font-size: 26pt; margin-bottom: 14pt; color: var(--navy);
    letter-spacing: -0.01em;
  }}
  .toc ol {{ list-style: none; padding: 0; margin: 0; }}
  .toc li {{
    display: flex; gap: 14pt; padding: 9pt 0;
    border-bottom: 0.25pt dotted var(--rule);
    font-size: 11pt; line-height: 1.4; color: var(--navy);
  }}
  .toc-num {{
    font-weight: 700; min-width: 32pt; color: var(--gold);
    letter-spacing: 0.04em;
  }}
  .toc-title {{ flex: 1; }}

  /* Sections */
  .sec-head {{
    display: flex; align-items: stretch; gap: 14pt;
    margin: 0 0 4pt 0;
  }}
  .sec-chip {{
    width: 56pt; height: 56pt;
    background: var(--navy); color: #fff;
    font-size: 18pt; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; letter-spacing: 0.02em;
  }}
  .sec-titles {{ flex: 1; padding-top: 4pt; }}
  .sec-kicker {{
    color: var(--gold); font-weight: 700; font-size: 8.5pt;
    letter-spacing: 0.16em; margin: 0 0 4pt 0;
  }}
  .sec-title {{
    font-size: 21pt; line-height: 1.18; margin: 0;
    letter-spacing: -0.008em; font-weight: 800;
  }}
  .sec-rule {{ height: 2pt; background: var(--gold); margin: 10pt 0 16pt 0; }}
  .sec-body h3 {{
    font-size: 12pt; color: var(--teal); margin: 14pt 0 6pt 0;
    letter-spacing: -0.003em; font-weight: 700;
  }}

  /* dl / kv / tables */
  dl {{ margin: 0 0 10pt 0; }}
  .dl-row {{ margin-bottom: 10pt; }}
  dt {{ font-weight: 700; color: var(--navy); margin-bottom: 2pt; line-height: 1.4; }}
  dd {{ margin: 0; text-align: justify; line-height: 1.65; }}
  .kv {{ margin: 0 0 10pt 0; }}
  .kv-row {{
    display: flex; gap: 14pt; padding: 7pt 0;
    border-bottom: 0.25pt solid var(--rule);
  }}
  .kv-k {{ flex: 0 0 38%; font-weight: 700; color: var(--navy); }}
  .kv-v {{ flex: 1; line-height: 1.55; }}
  table {{
    width: 100%; border-collapse: collapse;
    margin: 0 0 10pt 0; font-size: 10pt;
  }}
  th {{
    background: var(--navy); color: #fff;
    text-align: left; padding: 8pt 9pt; font-weight: 700;
    letter-spacing: 0.01em; font-size: 9.5pt;
  }}
  td {{
    padding: 8pt 9pt; border-bottom: 0.25pt solid var(--rule);
    vertical-align: top; line-height: 1.55;
  }}
  tbody tr:nth-child(even) td {{ background: #F8F6F1; }}
  .sig {{ font-weight: 700; color: var(--navy); margin-top: 12pt; font-style: italic; }}
</style>
</head>
<body>

<div class="cover">
  <p class="eyebrow">ইয়েস বাংলা প্রাইভেট লিমিটেড · ঢাকা · বাংলা সংস্করণ</p>
  <h1>কোম্পানি প্রোফাইল</h1>
  <p class="subtitle">একটি সমন্বিত এন্টারপ্রাইজ গ্রুপ — সফটওয়্যার, ডিজিটাল স্ট্রিমিং, সাংবাদিকতা, আইনি পরামর্শ, অর্গানিক বাণিজ্য, হোস্টিং, অন-ডিম্যান্ড সেবা ও ইভেন্ট।</p>
  <div class="strip"><b>গোপনীয়</b> · প্রাপকের জন্য · বাংলা সংস্করণ · {VERSION} · {GENERATED_BN}</div>
  <div class="glance">
    <div class="kv">
      <div class="kv-row"><div class="kv-k">আইনি নাম</div><div class="kv-v">ইয়েস বাংলা প্রাইভেট লিমিটেড</div></div>
      <div class="kv-row"><div class="kv-k">নিবন্ধিত অফিস</div><div class="kv-v">{OFFICE}</div></div>
      <div class="kv-row"><div class="kv-k">করপোরেট অফিস</div><div class="kv-v">{CORP}</div></div>
      <div class="kv-row"><div class="kv-k">সেল</div><div class="kv-v">{PHONE}</div></div>
      <div class="kv-row"><div class="kv-k">ইমেইল</div><div class="kv-v">{EMAIL}</div></div>
      <div class="kv-row"><div class="kv-k">ওয়েব</div><div class="kv-v">{WEB}</div></div>
      <div class="kv-row"><div class="kv-k">খাত</div><div class="kv-v">প্রযুক্তি · মিডিয়া · ব্রডকাস্টিং · ই-কমার্স · লাইফস্টাইল সেবা</div></div>
      <div class="kv-row"><div class="kv-k">ভেঞ্চার সংখ্যা</div><div class="kv-v">৮টি সক্রিয় ব্র্যান্ড · ৫টি উন্নয়নাধীন</div></div>
      <div class="kv-row"><div class="kv-k">ভাষা</div><div class="kv-v">বাংলা ও ইংরেজি (এই সংস্করণ: বাংলা)</div></div>
      <div class="kv-row"><div class="kv-k">সংস্করণ</div><div class="kv-v">{VERSION} · {GENERATED_BN}</div></div>
    </div>
  </div>
</div>

<section class="toc">
  <h2>সূচিপত্র</h2>
  <ol>{toc_items}</ol>
</section>

{''.join(sections_html)}

</body>
</html>
"""


# ---------------------------------------------------------------------------
# Playwright PDF generation — header/footer templates repeat letterhead
# reliably on every page, page numbering driven by page-settings.json.
# ---------------------------------------------------------------------------
import base64

SETTINGS_PATH = "/dev-server/scripts/page-settings.json"


def _load_settings():
    with open(SETTINGS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _data_uri(path: str) -> str:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    ext = "png" if path.lower().endswith(".png") else "jpeg"
    return f"data:image/{ext};base64,{b64}"


def _header_template(settings) -> str:
    if not settings["header"]["enabled"]:
        return "<div></div>"
    img = _data_uri(os.path.join("/dev-server", settings["header"]["image"]))
    h = settings["header"]["heightMm"]
    # Playwright header template runs in its own document with default zero
    # margins; width: 100% maps to full A4 width. Use mm units explicitly.
    return f"""
    <div style="margin:0;padding:0;width:100%;-webkit-print-color-adjust:exact;">
      <img src="{img}" style="display:block;width:100%;height:{h}mm;object-fit:cover;object-position:top;" />
    </div>
    """


def _footer_template(settings) -> str:
    if not settings["footer"]["enabled"]:
        return "<div></div>"
    img = _data_uri(os.path.join("/dev-server", settings["footer"]["image"]))
    fh = settings["footer"]["heightMm"]
    pn = settings["footer"].get("pageNumber", {})
    page_num_html = ""
    if pn.get("enabled"):
        size = pn.get("fontSizePt", 8)
        color = pn.get("color", "#FFFFFF")
        span_style = (
            f"font-size:{size}pt;color:{color};"
            "font-family:Helvetica,Arial,sans-serif;"
            "font-weight:600;letter-spacing:0.06em;line-height:1;"
        )
        page_span = f"<span class='pageNumber' style=\"{span_style}\"></span>"
        total_span = f"<span class='totalPages' style=\"{span_style}\"></span>"
        fmt = (pn["format"]
               .replace("{page}", page_span)
               .replace("{total}", total_span))
        right = pn.get("marginRightMm", 14)
        bottom = pn.get("marginBottomMm", 6)
        page_num_html = f"""
        <div style="position:absolute;right:{right}mm;bottom:{bottom}mm;
                    {span_style}
                    background:rgba(255,255,255,0.18);
                    border:0.5pt solid rgba(255,255,255,0.55);
                    padding:1.6pt 8pt;border-radius:99pt;
                    -webkit-print-color-adjust:exact;
                    print-color-adjust:exact;">
          {fmt}
        </div>
        """
    return f"""
    <div style="margin:0;padding:0;width:100%;height:{fh}mm;position:relative;
                font-size:{pn.get('fontSizePt', 8)}pt;
                -webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <img src="{img}" style="display:block;width:100%;height:{fh}mm;object-fit:cover;object-position:bottom;position:absolute;inset:0;" />
      {page_num_html}
    </div>
    """


def build():
    from playwright.sync_api import sync_playwright
    settings = _load_settings()
    html = render_html()
    with tempfile.TemporaryDirectory() as td:
        html_path = os.path.join(td, "profile-bn.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)

        m = settings["margins"]
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/bin/chromium",
                args=["--no-sandbox", "--disable-gpu"],
            )
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(f"file://{html_path}", wait_until="networkidle")
            page.pdf(
                path=PDF_OUT,
                format=settings.get("format", "A4"),
                landscape=(settings.get("orientation") == "landscape"),
                print_background=True,
                display_header_footer=True,
                header_template=_header_template(settings),
                footer_template=_footer_template(settings),
                margin={
                    "top": m["top"],
                    "right": m["right"],
                    "bottom": m["bottom"],
                    "left": m["left"],
                },
                prefer_css_page_size=False,
            )
            browser.close()
        print(f"[pdf-bn] wrote {PDF_OUT} ({os.path.getsize(PDF_OUT):,} bytes)")


if __name__ == "__main__":
    build()
