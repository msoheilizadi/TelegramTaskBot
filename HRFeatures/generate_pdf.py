import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from bidi.algorithm import get_display
import arabic_reshaper

def rtl(text):
    reshaped_text = arabic_reshaper.reshape(text)
    bidi_text = get_display(reshaped_text)
    return bidi_text

def generate_pdf(employee_reports, month, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []

    # Register Persian font
    font_path = os.path.join(os.path.dirname(__file__), "fonts", "IRANSans.ttf")
    pdfmetrics.registerFont(TTFont("PersianFont", font_path))
    style = ParagraphStyle(name="Persian", fontName="PersianFont", fontSize=12, alignment=2)  # alignment=2 -> right

    for emp in employee_reports:
        # Header
        elements.append(Paragraph(rtl(f"گزارش ماهانه {emp['name']} (ID: {emp['id']}) — ماه {month}"), style))
        elements.append(Spacer(1, 20))

        # Tasks table only
        tasks = emp.get("tasks", [])
        done_tasks = [t for t in tasks if t.get("done")]
        if done_tasks:
            data = [
                [rtl("ID"), rtl("عنوان"), rtl("تاریخ انجام")]
            ]
            for i, t in enumerate(done_tasks):
                # reshape & bidi **each cell** individually
                row = [
                    str(t.get("id", i+1)),
                    rtl(t.get("tasktitle", "")),
                    rtl(t.get("donetime", t.get("createtime", "-")))
                ]
                data.append(row)

            # Table with proportional column widths
            table = Table(data, colWidths=[50, 350, 100], hAlign='RIGHT')  # adjust widths
            table.setStyle(TableStyle([
                ('FONTNAME', (0,0), (-1,-1), 'PersianFont'),
                ('FONTSIZE', (0,0), (-1,-1), 12),
                ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.black),
                ('BACKGROUND', (0,0), (-1,0), colors.grey),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke)
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph(rtl("هیچ تسکی انجام نشده."), style))

        elements.append(Spacer(1, 30))

    doc.build(elements)

if __name__ == "__main__":
    import sys
    import json

    reports_json = sys.argv[1]  # JSON string or file path
    month = sys.argv[2]
    output_path = sys.argv[3]

    try:
        employee_reports = json.loads(reports_json)
    except json.JSONDecodeError:
        # if passing a file path
        with open(reports_json, "r", encoding="utf-8") as f:
            employee_reports = json.load(f)

    generate_pdf(employee_reports, month, output_path)
