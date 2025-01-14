{
	"translatorID": "b61c224b-34b6-4bfd-8a76-a476e7092d43",
	"label": "SSRN",
	"creator": "Sebastian Karcher",
	"target": "^https?://(www|papers|hq)\\.ssrn\\.com/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-08-28 19:49:43"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2013-2021 Sebastian Karcher and Abe Jellinek
	
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, _url) {
	if (doc.querySelector('meta[name="citation_title"]')) {
		return "report";
	}
	else if (getSearchResults(doc, true)) {
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, "//tr/td//strong/a[(@class='textlink' or @class='textLink') and contains(@href, 'papers.cfm?abstract_id')]");
	if (!rows.length) {
		rows = ZU.xpath(doc, "//div[contains(@class, 'trow')]//a[contains(@class, 'title') and contains(@href, 'ssrn.com/abstract=')]");
	}
	if (!rows.length) {
		rows = doc.querySelectorAll('h3 a.title:not([href*="javascript:"])');
	}
	if (!rows.length) {
		rows = doc.querySelectorAll('.title > a:not([href*="javascript:"])');
	}
	if (!rows.length) {
		rows = doc.querySelectorAll('a.paper-title');
	}
	for (let row of rows) {
		let href = row.href;
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, false), function (items) {
			if (items) ZU.processDocuments(Object.keys(items), scrape);
		});
	}
	else {
		scrape(doc, url);
	}
}

function scrape(doc, url) {
	var abstract = ZU.xpathText(doc, '//div[@class="abstract-text"]/p[1]');
	// We call the Embedded Metadata translator to do the actual work
	var translator = Zotero.loadTranslator("web");
	translator.setTranslator("951c027d-74ac-47d4-a107-9c3069ab7b48");
	translator.setDocument(doc);
	translator.setHandler("itemDone", function (obj, item) {
		if (item.date) {
			item.date = ZU.strToISO(item.date);
		}
		
		item.itemType = "report";
		item.reportType = "SSRN Scholarly Paper";
		item.institution = "Social Science Research Network";
		var number = url.match(/abstract_id=(\d+)/);
		if (number) item.reportNumber = "ID " + number[1];
		item.place = "Rochester, NY";
		if (abstract) item.abstractNote = abstract.trim();
		// The pdfurl in the meta tag 'citation_pdf_url' is just pointing
		// to the entry itself --> Delete this non-working attachment.
		for (var i = 0; i < item.attachments.length; i++) {
			if (item.attachments[i].title == "Full Text PDF") {
				item.attachments.splice(i, 1);
			}
		}
		// Extract the correct PDF URL from the download button
		var pdfURL = attr(doc, 'a.primary[data-abstract-id]', 'href');
		if (pdfURL) {
			item.attachments.push({
				title: "Full Text PDF",
				url: pdfURL,
				mimeType: "application/pdf"
			});
		}

		item.complete();
	});
	translator.translate();
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.ssrn.com/index.cfm/en/mit-political-science-dept/",
		"defer": true,
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=16042",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1450387",
		"items": [
			{
				"itemType": "report",
				"title": "Who Doesn't Support the Genocide Convention? A Nested Analysis",
				"creators": [
					{
						"firstName": "Michael",
						"lastName": "Strausz",
						"creatorType": "author"
					},
					{
						"firstName": "Brian D.",
						"lastName": "Greenhill",
						"creatorType": "author"
					}
				],
				"date": "2009",
				"abstractNote": "What explains the large variation in the time taken by different countries to ratify the 1948 Genocide Convention? The costs of ratiﬁcation would appear to be relatively low, yet many countries have waited for years, and even decades, before ratifying this symbolically important treaty. This study employs a \"nested analysis\" that combines a large-n event history analysis with a detailed study of an important outlying case in order to explain the main sources of this variation. The initial event history history produces a puzzling ﬁnding: countries appear to be less likely to ratify the treaty if relevant peer countries have already done so. We use the case of Japan -- which has not yet ratiﬁed the Genocide Convention, despite the predictions of the event history model -- to explore the proposed causes of ratiﬁcation in more detail. Based on these ﬁndings, we suggest that once the norms embodied in a treaty take on a sufﬁciently \"taken-for-granted\" character, many countries decide that the costs of ratiﬁcation outweigh its marginal beneﬁts. The pattern of ratiﬁcation of the Genocide Convention therefore does not appear to ﬁt the classic model of the \"norm cascade\" that has been used to explain the adoption of other human rights norms. We conclude with suggestions for how the validity of our theory could be tested through a combination of further large-n and small-n analysis.",
				"institution": "Social Science Research Network",
				"language": "en",
				"libraryCatalog": "papers.ssrn.com",
				"place": "Rochester, NY",
				"reportNumber": "ID 1450387",
				"reportType": "SSRN Scholarly Paper",
				"shortTitle": "Who Doesn't Support the Genocide Convention?",
				"url": "https://papers.ssrn.com/abstract=1450387",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					},
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "Japan"
					},
					{
						"tag": "event history analysis"
					},
					{
						"tag": "genocide"
					},
					{
						"tag": "hazard models"
					},
					{
						"tag": "human rights"
					},
					{
						"tag": "international law"
					},
					{
						"tag": "international norms"
					},
					{
						"tag": "mixed methods"
					},
					{
						"tag": "nested analysis"
					},
					{
						"tag": "norm cascades"
					},
					{
						"tag": "survival models"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://papers.ssrn.com/sol3/JELJOUR_Results.cfm?form_name=journalBrowse&journal_id=3671899",
		"items": "multiple"
	}
]
/** END TEST CASES **/
