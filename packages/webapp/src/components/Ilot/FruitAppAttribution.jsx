// import { ReactComponent as EuropeFlag } from '../../assets/images/ilot/flagOfEurope.svg';
import EuropeFlag from '../../assets/images/ilot/flagOfEurope.svg';
// import { ReactComponent as ProwLogo } from '../../assets/images/ilot/prowLogo.svg';
import ProwLogo from '../../assets/images/ilot/prowLogo.svg';
import React from 'react';

export default function FruitAppAttribution() {
  return (
    <div style={{ padding: '2rem 0', margin: '0 1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
        <div>
          {/* There is 810px to 540px, so: 1.5 ratio  */}
          <img
            src={EuropeFlag}
            alt="Europan Union Flag"
            style={{ maxHeight: '5rem', width: 'auto' }}
          />
        </div>
        <div>
          <img src={ProwLogo} alt="PROW Logo" style={{ maxHeight: '5rem', width: 'auto' }} />
        </div>
      </div>
      <div>
        <h2 style={{ textAlign: 'center', padding: '1rem 0' }}>
          &#34;Europejski Fundusz Rolny na rzecz Rozwoju Obszarów Wiejskich:
          <br />
          Europa inwestująca w obszary wiejskie&#34;
        </h2>
      </div>
      <div>
        <label>Operacja pn.</label>
        <p style={{ marginLeft: '3rem', fontWeight: 'bold' }}>
          FruitApp system do zarządzania sadem
        </p>
        <label>mająca na celu</label>
        <p style={{ marginLeft: '3rem' }}>
          Opracowanie i wdrożenie rozwiązania opartego na integracji systemów wykorzystywanych w
          sadownictwie w celu zautomatyzowania prowadzenia i pielęgnacji sadów.
        </p>
        <p style={{ textAlign: 'center', paddingTop: '1rem' }}>
          Współfinansowana jest ze środków Unii Europejskiej w ramach działania &#34;Współpraca&#34;
          Programu Rozwoju Obszarów Wiejskich na lata 2014-2020.
        </p>
      </div>
    </div>
  );
}
