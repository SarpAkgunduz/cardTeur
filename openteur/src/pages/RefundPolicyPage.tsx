import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import './LegalPage.css';

interface Section {
  heading: string;
  body: React.ReactNode;
}

const SECTIONS_EN: Section[] = [
  {
    heading: '1. Subscription Billing',
    body: (
      <p>
        Premium and Premium+ are recurring subscriptions billed in advance, monthly or annually
        depending on the plan you choose. Your subscription renews automatically at the end of each
        billing period unless you cancel before it renews.
      </p>
    ),
  },
  {
    heading: '2. Cancelling Your Subscription',
    body: (
      <p>
        You can cancel anytime from your account. Cancelling stops future renewals — you keep access
        to your paid plan until the end of the billing period you already paid for. Cancelling does
        not itself trigger a refund for the current period.
      </p>
    ),
  },
  {
    heading: '3. Refund Eligibility',
    body: (
      <>
        <p>We'll issue a refund if:</p>
        <ul>
          <li>You were charged in error or charged twice for the same billing period.</li>
          <li>A technical problem on our side meaningfully prevented you from using the plan you paid for, and we couldn't fix it in a reasonable time.</li>
          <li>You request a refund within <strong>7 days</strong> of your <em>first</em> payment for a new subscription (first-time subscribers only — not renewals).</li>
        </ul>
        <p>
          Outside of these cases, payments for time already used (including renewal periods) are
          generally non-refundable, consistent with standard SaaS subscription practice.
        </p>
      </>
    ),
  },
  {
    heading: '4. Referral Discounts',
    body: (
      <p>
        Discounts applied via a referral code (first-month or first-year pricing) are a one-time
        promotional reduction, not a separate refundable payment. Standard refund eligibility above
        still applies to the discounted charge.
      </p>
    ),
  },
  {
    heading: '5. How to Request a Refund',
    body: (
      <p>
        Email <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a> with the email address on your
        CardTeur account and the reason for your request. We'll respond within a few business days.
        Approved refunds are issued to your original payment method via Paddle or iyzico and may take
        several business days to appear on your statement, depending on your bank or card provider.
      </p>
    ),
  },
  {
    heading: '6. Changes to This Policy',
    body: (
      <p>
        We may update this Refund Policy from time to time. Material changes will be announced in the
        Service or by email before they take effect.
      </p>
    ),
  },
];

const SECTIONS_TR: Section[] = [
  {
    heading: '1. Abonelik Faturalandırması',
    body: (
      <p>
        Premium ve Premium+, seçtiğiniz plana bağlı olarak aylık veya yıllık olarak peşin
        faturalandırılan düzenli aboneliklerdir. Aboneliğiniz, yenilenmeden önce iptal etmediğiniz
        sürece her faturalama döneminin sonunda otomatik olarak yenilenir.
      </p>
    ),
  },
  {
    heading: '2. Aboneliğinizi İptal Etme',
    body: (
      <p>
        Hesabınızdan istediğiniz zaman iptal edebilirsiniz. İptal, gelecekteki yenilemeleri durdurur —
        zaten ödemesini yaptığınız faturalama döneminin sonuna kadar ücretli plan erişiminizi
        korursunuz. İptal işlemi tek başına mevcut dönem için bir iade tetiklemez.
      </p>
    ),
  },
  {
    heading: '3. İade Uygunluğu',
    body: (
      <>
        <p>Aşağıdaki durumlarda iade yaparız:</p>
        <ul>
          <li>Yanlışlıkla veya aynı faturalama dönemi için iki kez ücretlendirildiyseniz.</li>
          <li>Bizim tarafımızdaki teknik bir sorun, ödediğiniz planı kullanmanızı anlamlı şekilde engellediyse ve makul bir sürede çözemediysek.</li>
          <li>Yeni bir abonelik için <strong>ilk ödemenizden itibaren 7 gün içinde</strong> iade talep ederseniz (yalnızca ilk kez abone olanlar için — yenilemeler dahil değildir).</li>
        </ul>
        <p>
          Bunların dışında, halihazırda kullanılmış süreye ait ödemeler (yenileme dönemleri dahil),
          standart SaaS abonelik uygulamasıyla tutarlı şekilde genellikle iade edilmez.
        </p>
      </>
    ),
  },
  {
    heading: '4. Referans İndirimleri',
    body: (
      <p>
        Bir referans kodu üzerinden uygulanan indirimler (ilk ay veya ilk yıl fiyatlandırması), tek
        seferlik promosyon amaçlı bir indirimdir, ayrı ve iade edilebilir bir ödeme değildir.
        İndirimli ücrete de yukarıdaki standart iade uygunluğu koşulları uygulanır.
      </p>
    ),
  },
  {
    heading: '5. İade Nasıl Talep Edilir',
    body: (
      <p>
        CardTeur hesabınızdaki e-posta adresi ve talebinizin nedeniyle birlikte{' '}
        <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a> adresine e-posta gönderin. Birkaç iş
        günü içinde yanıt veririz. Onaylanan iadeler, Paddle veya iyzico aracılığıyla orijinal ödeme
        yönteminize yapılır ve bankanıza veya kart sağlayıcınıza bağlı olarak hesap özetinizde
        görünmesi birkaç iş günü sürebilir.
      </p>
    ),
  },
  {
    heading: '6. Bu Politikadaki Değişiklikler',
    body: (
      <p>
        Bu İade Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler yürürlüğe girmeden
        önce Hizmet içinde veya e-posta yoluyla duyurulacaktır.
      </p>
    ),
  },
];

const RefundPolicyPage = () => {
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
            <h2 className="page-title">{isTR ? 'İade Politikası' : 'Refund Policy'}</h2>
          </div>

          <div className="legal-page">
            <span className="legal-page__updated">
              {isTR ? 'Son güncelleme: 10 Temmuz 2026' : 'Last updated: July 10, 2026'}
            </span>

            <p className="legal-page__intro">
              {isTR ? (
                <>
                  Bu İade Politikası, CardTeur üzerinden satın alınan Premium ve Premium+
                  aboneliklerine uygulanır. Ödemeler, bölgenize bağlı olarak Paddle.com Market Limited
                  veya iyzico tarafından işlenir — iadeler, satın alımınızı hangi sağlayıcı işlediyse
                  onun aracılığıyla orijinal ödeme yönteminize yapılır.
                </>
              ) : (
                <>
                  This Refund Policy applies to Premium and Premium+ subscriptions purchased through
                  CardTeur. Payments are processed by Paddle.com Market Limited or iyzico, depending
                  on your region — refunds are issued back to your original payment method through
                  whichever processor handled your purchase.
                </>
              )}
            </p>

            <div className="legal-page__notice">
              <p>
                {isTR ? (
                  <>
                    <strong>Güncel durum:</strong> Otomatik iade/iptal sistemimiz henüz devreye
                    alınmadı. Şu anda tüm iade talepleri, satın alımı işleyen ödeme sağlayıcının
                    (Paddle veya iyzico) panelinden elle incelenip işleniyor. Otomatik iade ve iptal
                    akışını en yakın zamanda entegre edeceğiz; bu sayfa canlıya alındığında
                    güncellenecektir.
                  </>
                ) : (
                  <>
                    <strong>Current status:</strong> We don't have an automated refund/cancellation
                    system live yet. Every refund request today is reviewed and processed manually
                    through our payment processor's dashboard (Paddle or iyzico). We plan to integrate
                    automated refund handling soon — this page will be updated once that ships.
                  </>
                )}
              </p>
            </div>

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

export default RefundPolicyPage;
