import {
  countrySlugToCurrency,
  extractCountrySlugFromUrl,
  extractEconomicValuesFromDescriptionHtml,
  extractImpactFromDescriptionHtml,
} from "../../../../packages/launchthat-plugin-news/src/convex/component/ingest/economicRssMyFxBook";

describe("news economic RSS parsing (MyFxBook)", () => {
  test("extracts country slug from url", () => {
    const slug = extractCountrySlugFromUrl(
      "https://www.myfxbook.com/forex-economic-calendar/singapore/5-year-bond-auction",
    );
    expect(slug).toBe("singapore");
  });

  test("maps country slug to currency", () => {
    expect(countrySlugToCurrency("singapore")).toEqual({
      country: "Singapore",
      currency: "SGD",
    });
    expect(countrySlugToCurrency("united-states").currency).toBe("USD");
    expect(countrySlugToCurrency("japan").currency).toBe("JPY");
  });

  test("extracts impact from description html", () => {
    const html =
      '<td><span class="sprite sprite-common sprite-low-impact"></span></td>';
    expect(extractImpactFromDescriptionHtml(html)).toBe("low");
  });

  test("extracts previous/forecast/actual from MyFxBook table html", () => {
    const html = `
      <table style='border-spacing:5px;' border='0'>
        <tr>
          <th>Time left</th>
          <th>Impact</th>
          <th>Previous</th>
          <th>Consensus</th>
          <th>Actual</th>
        </tr>
        <tr>
          <td>-55152 seconds</td>
          <td><span class="sprite sprite-common sprite-low-impact"></span></td>
          <td>1.53%</td>
          <td></td>
          <td>1.61%</td>
        </tr>
      </table>
    `;
    const res = extractEconomicValuesFromDescriptionHtml(html);
    expect(res.previous).toBe("1.53%");
    expect(res.forecast).toBeUndefined();
    expect(res.actual).toBe("1.61%");
  });
});

