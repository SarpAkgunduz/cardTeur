import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import './LegalPage.css';

interface Section {
  heading: string;
  body: React.ReactNode;
}

const OPERATOR_NAME = 'Sarp Akgündüz';

const SECTIONS_EN: Section[] = [
  {
    heading: '1. The Service',
    body: (
      <p>
        CardTeur helps amateur football players and organizers manage rosters, build FIFA-style
        player cards from tracked stats, form crews, plan matches and formations, and vote on each
        other's cards to drive friendly competition. Some features are available on a free plan;
        others require a paid subscription (see Section 4).
      </p>
    ),
  },
  {
    heading: '2. Accounts',
    body: (
      <p>
        You need an account to use most of the Service. Accounts are created and authenticated via
        Firebase (email/password or Google sign-in). You must provide accurate information and are
        responsible for all activity under your account and for keeping your credentials secure.
        Tell us immediately if you suspect unauthorized access.
      </p>
    ),
  },
  {
    heading: "3. Player Cards, Crews & Matches",
    body: (
      <p>
        Player card stats, images, formations, and match data you create or upload ("Your Content")
        remain yours. By uploading Your Content you grant CardTeur a license to store, process, and
        display it within the Service (e.g. showing a card to your crew, or in a formation you
        build) — only for the purpose of operating the Service. You confirm you have the right to
        upload any image or content you attach to a player card (e.g. consent from the person
        pictured), and that it does not infringe anyone's rights.
      </p>
    ),
  },
  {
    heading: '4. Subscriptions & Billing',
    body: (
      <p>
        CardTeur offers Free, Premium, and Premium+ plans. Paid plans are billed on a recurring
        basis (monthly or annual, as selected) via our payment processors — Paddle.com Market
        Limited (international) or iyzico (Turkey) — who act as merchant of record and handle
        payment processing on our behalf. Subscriptions renew automatically at the end of each
        billing period unless cancelled before renewal. You can cancel anytime from your account;
        cancellation takes effect at the end of the current billing period, and you keep paid-plan
        access until then. See our <a href="/refunds">Refund Policy</a> for refund terms. We may
        change subscription pricing with advance notice; changes apply from your next renewal.
      </p>
    ),
  },
  {
    heading: '5. Referral Program',
    body: (
      <p>
        Paid subscribers may receive a limited number of referral slots to invite others to the
        Service at a discount. Referral codes are single-use and tied to your account. We may
        suspend referral rewards for accounts we reasonably believe are gaming the program (e.g.
        self-referrals, fake accounts).
      </p>
    ),
  },
  {
    heading: '6. Voting & Fair Play',
    body: (
      <p>
        The card-voting feature is meant to add friendly competition among real teammates. Do not
        use it to harass, manipulate ratings through fake accounts, or target players outside the
        intended crew/friend context. We may remove votes or restrict accounts that abuse this
        feature.
      </p>
    ),
  },
  {
    heading: '7. Acceptable Use',
    body: (
      <ul>
        <li>No uploading unlawful, hateful, or sexually explicit content, or content involving minors in any inappropriate way.</li>
        <li>No impersonating another person or misrepresenting your affiliation with a crew or player.</li>
        <li>No attempting to disrupt, reverse engineer, or gain unauthorized access to the Service.</li>
        <li>No automated scraping or bulk data extraction without our written permission.</li>
      </ul>
    ),
  },
  {
    heading: '8. Termination',
    body: (
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        terminate accounts that violate these Terms, with notice where reasonably possible. Sections
        that by their nature should survive termination (e.g. Section 9–11) continue to apply.
      </p>
    ),
  },
  {
    heading: '9. Disclaimer of Warranties',
    body: (
      <p>
        The Service is provided "as is" and "as available," without warranties of any kind, express
        or implied, including fitness for a particular purpose, non-infringement, or
        uninterrupted/error-free operation.
      </p>
    ),
  },
  {
    heading: '10. Limitation of Liability',
    body: (
      <p>
        To the maximum extent permitted by law, CardTeur is not liable for indirect, incidental, or
        consequential damages arising from your use of the Service. Our total liability for any
        claim relating to the Service is limited to the amount you paid us in the 12 months before
        the claim arose.
      </p>
    ),
  },
  {
    heading: '11. Governing Law',
    body: (
      <p>
        These Terms are governed by the laws of the Republic of Turkey, without regard to
        conflict-of-law rules, unless mandatory consumer-protection law in your country of residence
        provides otherwise.
      </p>
    ),
  },
  {
    heading: '12. Changes to These Terms',
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be announced in the
        Service or by email before they take effect. Continued use after changes take effect means
        you accept the updated Terms.
      </p>
    ),
  },
  {
    heading: '13. Contact',
    body: (
      <p>
        Questions about these Terms? Contact us at <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a>.
      </p>
    ),
  },
];

const SECTIONS_TR: Section[] = [
  {
    heading: '1. Hizmet',
    body: (
      <p>
        CardTeur, amatör futbolcuların ve organizatörlerin kadro yönetimi yapmasına, takip edilen
        istatistiklerden FIFA tarzı oyuncu kartları oluşturmasına, ekip (crew) kurmasına, maç ve
        diziliş planlamasına ve birbirlerinin kartlarına oy vererek dostane bir rekabet ortamı
        yaratmasına yardımcı olur. Bazı özellikler ücretsiz planda sunulur; diğerleri ücretli
        abonelik gerektirir (bkz. Madde 4).
      </p>
    ),
  },
  {
    heading: '2. Hesaplar',
    body: (
      <p>
        Hizmetin çoğu özelliğini kullanmak için bir hesaba ihtiyacınız vardır. Hesaplar Firebase
        üzerinden (e-posta/şifre veya Google ile giriş) oluşturulur ve doğrulanır. Doğru bilgi
        vermeniz, hesabınız altındaki tüm etkinlikten sorumlu olmanız ve kimlik bilgilerinizi güvende
        tutmanız gerekir. Yetkisiz erişimden şüphelenirseniz bize hemen bildirin.
      </p>
    ),
  },
  {
    heading: '3. Oyuncu Kartları, Ekipler ve Maçlar',
    body: (
      <p>
        Oluşturduğunuz veya yüklediğiniz oyuncu kartı istatistikleri, görseller, dizilişler ve maç
        verileri ("İçeriğiniz") size aittir. İçeriğinizi yükleyerek CardTeur'a, yalnızca Hizmeti
        işletmek amacıyla, bunları depolama, işleme ve görüntüleme (örn. bir kartı ekibinize göstermek
        veya oluşturduğunuz bir dizilişte kullanmak) lisansı vermiş olursunuz. Bir oyuncu kartına
        eklediğiniz her görsel veya içerik üzerinde gerekli hakka sahip olduğunuzu (örn. görselde yer
        alan kişinin izni) ve bunun başkasının haklarını ihlal etmediğini teyit edersiniz.
      </p>
    ),
  },
  {
    heading: '4. Abonelikler ve Faturalandırma',
    body: (
      <p>
        CardTeur; Ücretsiz, Premium ve Premium+ planları sunar. Ücretli planlar, seçtiğiniz aralığa
        göre (aylık veya yıllık) düzenli olarak faturalandırılır ve ödeme işlemlerini bizim adımıza
        yürüten Paddle.com Market Limited (uluslararası) veya iyzico (Türkiye) ödeme sağlayıcıları
        üzerinden tahsil edilir. Abonelikler, yenilemeden önce iptal edilmediği sürece her faturalama
        döneminin sonunda otomatik olarak yenilenir. Hesabınızdan istediğiniz zaman iptal
        edebilirsiniz; iptal, mevcut faturalama döneminin sonunda geçerli olur ve o zamana kadar
        ücretli plan erişiminizi korursunuz. İade koşulları için bkz.{' '}
        <a href="/refunds">İade Politikası</a>. Abonelik fiyatlarını önceden bildirimde bulunarak
        değiştirebiliriz; değişiklikler bir sonraki yenilemenizden itibaren geçerli olur.
      </p>
    ),
  },
  {
    heading: '5. Referans Programı',
    body: (
      <p>
        Ücretli aboneler, başkalarını Hizmete indirimli olarak davet etmek için sınırlı sayıda
        referans hakkı alabilir. Referans kodları tek kullanımlıktır ve hesabınıza bağlıdır. Programı
        kötüye kullandığına makul şekilde inandığımız hesaplarda (örn. kendine referans verme, sahte
        hesaplar) referans ödüllerini askıya alabiliriz.
      </p>
    ),
  },
  {
    heading: '6. Oylama ve Adil Oyun',
    body: (
      <p>
        Kart oylama özelliği, gerçek takım arkadaşları arasında dostane bir rekabet katmak içindir.
        Bu özelliği taciz etmek, sahte hesaplarla puanları manipüle etmek veya amaçlanan ekip/arkadaş
        bağlamı dışındaki oyuncuları hedef almak için kullanmayınız. Bu özelliği kötüye kullanan
        hesaplardaki oyları kaldırabilir veya hesabı kısıtlayabiliriz.
      </p>
    ),
  },
  {
    heading: '7. Kabul Edilebilir Kullanım',
    body: (
      <ul>
        <li>Yasa dışı, nefret söylemi içeren veya müstehcen içerik ya da reşit olmayanları herhangi bir uygunsuz şekilde içeren içerik yüklemek yasaktır.</li>
        <li>Başka bir kişiyi taklit etmek veya bir ekip/oyuncuyla olan bağlantınızı yanlış beyan etmek yasaktır.</li>
        <li>Hizmeti bozmaya, tersine mühendislik yapmaya veya yetkisiz erişim sağlamaya çalışmak yasaktır.</li>
        <li>Yazılı iznimiz olmadan otomatik veri kazıma veya toplu veri çekme yasaktır.</li>
      </ul>
    ),
  },
  {
    heading: '8. Fesih',
    body: (
      <p>
        Hizmeti kullanmayı istediğiniz zaman durdurabilir ve hesabınızı silebilirsiniz. Bu Şartları
        ihlal eden hesapları, makul ölçüde mümkün olduğunda bildirimde bulunarak askıya alabilir veya
        sonlandırabiliriz. Doğası gereği fesihten sonra da geçerliliğini koruması gereken maddeler
        (örn. Madde 9–11) yürürlükte kalmaya devam eder.
      </p>
    ),
  },
  {
    heading: '9. Garanti Reddi',
    body: (
      <p>
        Hizmet, "olduğu gibi" ve "mevcut olduğu şekliyle" sunulmakta olup, belirli bir amaca
        uygunluk, ihlal etmeme veya kesintisiz/hatasız çalışma dahil, açık veya zımni hiçbir garanti
        verilmemektedir.
      </p>
    ),
  },
  {
    heading: '10. Sorumluluğun Sınırlandırılması',
    body: (
      <p>
        Yürürlükteki yasaların izin verdiği azami ölçüde, CardTeur, Hizmeti kullanımınızdan
        kaynaklanan dolaylı, arızi veya sonuç niteliğindeki zararlardan sorumlu değildir. Hizmetle
        ilgili herhangi bir talebe ilişkin toplam sorumluluğumuz, talebin doğduğu tarihten önceki 12
        ay içinde bize ödediğiniz tutarla sınırlıdır.
      </p>
    ),
  },
  {
    heading: '11. Uygulanacak Hukuk',
    body: (
      <p>
        Bu Şartlar, ikamet ettiğiniz ülkenin zorunlu tüketici koruma hükümleri aksini öngörmedikçe,
        kanunlar ihtilafı kurallarına bakılmaksızın Türkiye Cumhuriyeti kanunlarına tabidir ve buna
        göre yorumlanır.
      </p>
    ),
  },
  {
    heading: '12. Bu Şartlardaki Değişiklikler',
    body: (
      <p>
        Bu Şartları zaman zaman güncelleyebiliriz. Önemli değişiklikler yürürlüğe girmeden önce
        Hizmet içinde veya e-posta yoluyla duyurulacaktır. Değişiklikler yürürlüğe girdikten sonra
        Hizmeti kullanmaya devam etmeniz, güncellenmiş Şartları kabul ettiğiniz anlamına gelir.
      </p>
    ),
  },
  {
    heading: '13. İletişim',
    body: (
      <p>
        Bu Şartlarla ilgili sorularınız için bize <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a> adresinden ulaşabilirsiniz.
      </p>
    ),
  },
];

const TermsPage = () => {
  const { i18n } = useTranslation();
  const isTR = (i18n.resolvedLanguage || i18n.language || '').startsWith('tr');
  const sections = isTR ? SECTIONS_TR : SECTIONS_EN;

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton fallback="/" position="static" />
            </div>
            <h2 className="page-title">{isTR ? 'Kullanım Şartları' : 'Terms of Service'}</h2>
          </div>

          <div className="legal-page">
            <span className="legal-page__updated">
              {isTR ? 'Son güncelleme: 10 Temmuz 2026' : 'Last updated: July 10, 2026'}
            </span>

            <p className="legal-page__intro">
              {isTR ? (
                <>
                  Bu Kullanım Şartları ("Şartlar"), {OPERATOR_NAME} ("CardTeur", "biz") tarafından
                  işletilen CardTeur hizmetine ("Hizmet") erişiminizi ve kullanımınızı düzenler. Bir
                  hesap oluşturarak veya Hizmeti kullanarak bu Şartları kabul etmiş olursunuz. Kabul
                  etmiyorsanız Hizmeti kullanmayınız.
                </>
              ) : (
                <>
                  These Terms of Service ("Terms") govern access to and use of CardTeur (the
                  "Service"), operated by {OPERATOR_NAME} ("CardTeur", "we", "us"). By creating an
                  account or using the Service you agree to these Terms. If you do not agree, do not
                  use the Service.
                </>
              )}
            </p>

            {sections.map((s) => (
              <div className="legal-page__section" key={s.heading}>
                <h3>{s.heading}</h3>
                {s.body}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
