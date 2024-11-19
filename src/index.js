// todo: cached values aren't getting used

// the icon is "map-marker-off-outline" from the "Material Design Icons (Community)" Figma plugin
const locationErrorSvg = (
  fill = "black"
) => `<svg width="43" height="43" viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M35.4492 34.5502L6.22422 5.3252L3.94922 7.6002L9.54922 13.2002C9.37422 14.0752 9.19922 14.9502 9.19922 15.8252C9.19922 24.9252 21.4492 38.5752 21.4492 38.5752C21.4492 38.5752 24.4242 35.2502 27.3992 30.8752L33.3492 36.8252L35.4492 34.5502ZM21.4492 32.8002C13.3992 21.9502 12.6992 18.2752 12.6992 16.3502L24.5992 28.2502C23.7242 29.6502 22.6742 31.0502 21.4492 32.8002ZM15.1492 9.8752L12.6992 7.42519C14.7992 4.9752 17.9492 3.5752 21.4492 3.5752C28.2742 3.5752 33.6992 9.0002 33.6992 15.8252C33.6992 18.8002 32.4742 22.1252 30.7242 25.4502L28.0992 22.8252C30.1992 18.6252 30.1992 16.8752 30.1992 15.8252C30.1992 10.9252 26.3492 7.0752 21.4492 7.0752C18.9992 7.0752 16.7242 8.1252 15.1492 9.8752ZM21.4492 11.4502C23.8992 11.4502 25.8242 13.3752 25.8242 15.8252C25.8242 17.0502 25.2992 18.2752 24.4242 19.1502L18.2992 13.0252C18.9992 11.9752 20.2242 11.4502 21.4492 11.4502Z" fill="${fill}"/>
</svg>`;

// the icon is "map-marker-outline" from the "Material Design Icons (Community)" Figma plugin
const locationSvg = (
  fill = "black"
) => `<svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.2293 19.5713C18.2295 20.5715 19.586 21.1334 21.0005 21.1334C21.7009 21.1334 22.3944 20.9955 23.0415 20.7274C23.6886 20.4594 24.2765 20.0666 24.7718 19.5713C25.267 19.0761 25.6599 18.4881 25.9279 17.8411C26.1959 17.194 26.3339 16.5005 26.3339 15.8001C26.3339 14.3856 25.772 13.029 24.7718 12.0288C23.7716 11.0287 22.415 10.4667 21.0005 10.4667C19.586 10.4667 18.2295 11.0287 17.2293 12.0288C16.2291 13.029 15.6672 14.3856 15.6672 15.8001C15.6672 17.2146 16.2291 18.5711 17.2293 19.5713ZM21.0005 36.8098C20.6995 36.4562 20.3189 36.0015 19.8811 35.4621C18.7565 34.0764 17.2587 32.137 15.7628 29.9199C14.265 27.7 12.7816 25.2198 11.6756 22.7511C10.5638 20.2694 9.86719 17.8727 9.86719 15.8001C9.86719 12.8473 11.0402 10.0155 13.1281 7.92763C15.216 5.83972 18.0478 4.66675 21.0005 4.66675C23.9533 4.66675 26.7851 5.83972 28.873 7.92763C30.9609 10.0155 32.1339 12.8473 32.1339 15.8001C32.1339 17.8727 31.4372 20.2694 30.3254 22.7511C29.2195 25.2198 27.736 27.7 26.2382 29.9199C24.7424 32.137 23.2445 34.0764 22.1199 35.4621C21.6821 36.0015 21.3015 36.4562 21.0005 36.8098Z" fill="black" fill-opacity="0.5" stroke="white" stroke-width="2"/>
</svg>`;

// the icon is "open-in-new" from the "Material Design Icons (Community)" Figma plugin
const openInNewTabSvg = (
  fill = "black"
) => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10.8333 0.75V2.58333H14.1242L5.11333 11.5942L6.40583 12.8867L15.4167 3.87583V7.16667H17.25V0.75M15.4167 15.4167H2.58333V2.58333H9V0.75H2.58333C1.56583 0.75 0.75 1.575 0.75 2.58333V15.4167C0.75 15.9029 0.943154 16.3692 1.28697 16.713C1.63079 17.0568 2.0971 17.25 2.58333 17.25H15.4167C15.9029 17.25 16.3692 17.0568 16.713 16.713C17.0568 16.3692 17.25 15.9029 17.25 15.4167V9H15.4167V15.4167Z" fill="${fill}"/>
</svg>`;

/**
 * @param zoom must be between 1 and 20
 * @returns something like https://www.google.com/maps?q=38.7532,0.2238&ll=38.7532,0.2238&z=15
 */
const getMapsLink = (lat, lng, zoom = 15) => {
  if (lat == null || lng == null) return null;
  // the `q` parameter places the pin, the `ll` parameter is required so the zoom parameter gets respected
  return (
    "https://www.google.com/maps?q=" +
    lat +
    "," +
    lng +
    "&ll=" +
    lat +
    "," +
    lng +
    "&z=" +
    zoom
  );
};

function getLocationUrl() {
  const reportErrorLink = document.querySelector(
    '[href^="https://www.google.com/maps/"]'
  );

  // looks like https://www.google.com/maps/@38.7532,0.2238,14z/data=!10m1!1e1!12b1?source=apiv3&rapsrc=apiv3
  const reportErrorHref = reportErrorLink?.getAttribute("href");

  const latLon = reportErrorHref?.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)?.[0];

  const [lat, lng] = latLon?.split(",") ?? [];

  const locationUrl = getMapsLink(lat, lng);

  return locationUrl;
}
function mountMapLink(url) {
  const buttonContainer = document.querySelector(
    'div:has(> [data-testid="map/ZoomInButton"])'
  );

  if (buttonContainer) {
    buttonContainer.style.setProperty("--fh3k5d", "123px");

    buttonContainer.insertAdjacentHTML(
      "beforeend",
      `<a href="${url}" target="_blank" class="scout-location-on-map cj0q2ib atm_7l_18pqv07 atm_9s_1txwivl atm_fc_1h6ojuz atm_h_1h6ojuz atm_26_1o0nnai_1o5j5ji atm_3f_glywfm_1o5j5ji atm_7l_161hw1_1o5j5ji atm_9j_13gfvf7_1o5j5ji sne7mb7 atm_vy_1ylpe5n atm_e2_1ylpe5n atm_mk_h2mmj6 atm_2d_1nh1gcj_1nos8r rp6dtyx atm_3f_glywfm atm_gi_idpfg4 atm_l8_idpfg4 atm_26_1j28jx2 atm_ks_ewfl5b atm_bv_1kw7nm4 c1y4i074 atm_kd_glywfm_pfnrn2 atm_2d_1nh1gcj_pfnrn2 atm_kd_glywfm_1w3cfyq atm_3f_1xus584_1w3cfyq atm_kd_glywfm_18zk5v0 atm_3f_1xus584_18zk5v0 dir dir-ltr">
  ${openInNewTabSvg(url == null ? "red" : "#222322")}
</a>`
    );
  }
}

let hasExecuted = false;

function tryToAttachListingUi() {
  const linkHrefs = Array.from(
    document.querySelectorAll(`[data-section-id="LOCATION_DEFAULT"] a`)
  );

  const isMapPresent = linkHrefs.length > 0;

  if (isMapPresent && !hasExecuted) {
    hasExecuted = true;

    mountMapLink(getLocationUrl());
  }
}

let listingData = {};

async function tryToAttachSearchUi() {
  const listings = Array.from(
    document.querySelectorAll(
      '#site-content div[data-pageslot="true"] div:has( > a[href^="/rooms/"]:first-child):has(> div:nth-child(2))'
    )
  );

  await Promise.allSettled(
    listings.map(async (i) => {
      const url = i.querySelector("a")?.getAttribute("href");

      if (!url) return;

      const cachedData = listingData[url];

      if (cachedData?.loading) return;

      if (i.querySelector(".scout-location-link")) return;

      const alreadyAttemptedToLoad =
        cachedData != null && cachedData.locationUrl === null;

      const locationUrl = alreadyAttemptedToLoad
        ? cachedData.locationUrl
        : await fetchListingLocationFromUrl(url);

      if (i.querySelector(".scout-location-link")) return;

      const likeButtonContainer = i.querySelector(
        'div:has(> button[data-testid="listing-card-save-button"])'
      );

      if (!locationUrl) {
        likeButtonContainer?.insertAdjacentHTML(
          "beforeend",
          `<div class="scout-location-link disabled">
            ${locationErrorSvg("#747577")}
          </div>`
        );
        return;
      }

      likeButtonContainer?.insertAdjacentHTML(
        "beforeend",
        `<a href="${locationUrl}" target="_blank" class="scout-location-link">
          ${locationSvg()}
        </a>`
      );

      listingData[url] = { locationUrl };

      return {
        url,
        locationUrl,
      };
    })
  );
}

function loadStyles(css) {
  const style = document.createElement("style");

  style.innerHTML = css;

  document.head.appendChild(style);
}

const globalCss = `.scout-location-link {
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0.25rem;

  border: none;
  border-radius: 0.25rem;

  transition-duration: 200ms;
} 
.scout-location-link:not(.disabled):hover {
  transform: scale(1.1);
}
.scout-location-link.disabled {
  pointer-events: none;
}
.scout-location-on-map {
  border-top: 1px solid #E5E5E5 !important;

  transition-duration: 100ms;
}
.scout-location-on-map:hover {
  background: #F7F7F7;
}`;

function main() {
  setInterval(tryToAttachSearchUi, 100);
  setInterval(tryToAttachListingUi, 100);

  loadStyles(globalCss);

  setInterval(() => {
    const zeugsContainer = document.querySelector("#s_zeug");
    const link = document.querySelector('[data-zeug-action="google-maps"]');

    const currentId = parseInt(window.location.pathname.replace(/\//g, ""));

    if (zeugsContainer && typeof currentId === "number" && !isNaN(currentId)) {
      // window.addressPoints_pingpong
      const addressPoints_pingpong = JSON.parse(
        document
          .querySelector("head script:not([src])")
          .innerHTML.replace(/'/g, '"')
          .replace(/\s*var addressPoints_pingpong = /, "")
          .replace(/\s*\t\s*/, "")
      );
      // [ "52.4907", "13.4726", 1, 1, 1, 0, 0, 0, 0 ]
      const item = addressPoints_pingpong.find((i) => i[2] === currentId);

      const mapsLink = item ? getMapsLink(item[0], item[1]) : null;

      if (link) {
        link.href = mapsLink;
      } else {
        zeugsContainer.insertAdjacentHTML(
          "beforeend",
          `<div data-zeug-action="google-maps" id="s_permalink" class="shadow"><a href="${mapsLink}"><img src="images/permalink.svg"></a></div>`
        );
      }
    }
  }, 100);
}
main();

async function fetchListingLocationFromUrl(url) {
  try {
    listingData[url] = { loading: true };

    const res = await fetch(url);

    const listingHtml = await res.text();

    const [_, lat, lng] =
      listingHtml.match(/"lat":(.+),"lng":(.+),"homeIcon"/) ?? [];

    if (!lat || !lng) return null;

    return getMapsLink(lat, lng);
  } catch (err) {
    return null;
  }
}
