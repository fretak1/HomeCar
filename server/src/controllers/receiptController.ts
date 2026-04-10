import { Request, Response } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import prisma from '../lib/prisma.js';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadReceipt = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                payer: {
                    select: { id: true, name: true, email: true, phoneNumber: true }
                },
                payee: {
                    select: { id: true, name: true, email: true }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        location: {
                            select: {
                                city: true,
                                subcity: true
                            }
                        }
                    }
                }
            }
        });

        if (!transaction) {
            console.warn(`[ReceiptGen] Transaction ${id} not found in database.`);
            return res.status(404).json({ error: 'Transaction record not found' });
        }

        // Security check: Only payer, payee or admin can download
        if (req.user.role !== 'ADMIN' && transaction.payerId !== userId && transaction.payeeId !== userId) {
            console.warn(`[ReceiptGen] Access denied for user ${userId} on transaction ${id}. User Role: ${req.user.role}`);
            return res.status(403).json({ error: 'You do not have permission to download this receipt' });
        }

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
        const { width, height } = page.getSize();

        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const italicBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

        // Color constants
        const primaryColor = rgb(0, 0.353, 0.255); // #005a41
        const mutedForeground = rgb(0.45, 0.45, 0.45);
        const borderColor = rgb(0.9, 0.9, 0.9);
        const foregroundColor = rgb(0.1, 0.1, 0.1);
        const successBg = rgb(0.86, 0.95, 0.91); // green-100
        const successText = rgb(0.08, 0.44, 0.3); // green-700
        const pendingBg = rgb(1, 0.96, 0.86); // amber-100
        const pendingText = rgb(0.7, 0.4, 0.08); // amber-700

        // Header Section
        // Draw Logo from public directory
        try {
            const logoPath = path.resolve(__dirname, '../../../client/public/homecar.png');
            if (fs.existsSync(logoPath)) {
                const logoBytes = fs.readFileSync(logoPath);
                const logoImage = await pdfDoc.embedPng(logoBytes);
                
                page.drawImage(logoImage, {
                    x: 50,
                    y: height - 110,
                    width: 60,
                    height: 60,
                });
            } else {
                // Fallback to rectangle if logo not found
                page.drawRectangle({
                    x: 50,
                    y: height - 100,
                    width: 44,
                    height: 44,
                    color: primaryColor,
                });
            }
        } catch (logoError) {
            console.error('Error embedding logo:', logoError);
            page.drawRectangle({
                x: 50,
                y: height - 100,
                width: 44,
                height: 44,
                color: primaryColor,
            });
        }

        page.drawText('HomeCar', {
            x: 105,
            y: height - 85,
            size: 32, // Increased slightly to match 3xl
            font: italicBoldFont,
            color: primaryColor,
        });

        // Big "RECEIPT" Background Text - SHIFTED LEFT to avoid clipping
        const receiptText = 'RECEIPT';
        const receiptFontSize = 60;
        const receiptTextWidth = boldFont.widthOfTextAtSize(receiptText, receiptFontSize);
        page.drawText(receiptText, {
            x: width - receiptTextWidth - 50,
            y: height - 100,
            size: receiptFontSize,
            font: boldFont,
            color: rgb(0.97, 0.97, 0.97), // Even lighter for subtle effect
        });

        // Company Details
        const companyY = height - 130;
        page.drawText('HomeCar Property Management Ltd.', { x: 50, y: companyY, size: 10, font: boldFont, color: foregroundColor });
        page.drawText('123 Business Avenue, Bole', { x: 50, y: companyY - 15, size: 10, font: regularFont, color: mutedForeground });
        page.drawText('Addis Ababa, Ethiopia', { x: 50, y: companyY - 30, size: 10, font: regularFont, color: mutedForeground });
        page.drawText('support@homecar.com', { x: 50, y: companyY - 45, size: 10, font: regularFont, color: mutedForeground });

        // Transaction Info (Top Right)
        const txInfoY = height - 140;
        const rightLabelX = width - 240;
        page.drawText('TRANSACTION REFERENCE', { x: rightLabelX, y: txInfoY, size: 8, font: boldFont, color: mutedForeground });
        page.drawText(transaction.chapaReference || `#TX-${transaction.id.toUpperCase().substring(0, 12)}`, { x: rightLabelX, y: txInfoY - 18, size: 11, font: boldFont, color: foregroundColor });

        // Status Badge
        const isCompleted = transaction.status === 'COMPLETED';
        const badgeBg = isCompleted ? successBg : pendingBg;
        const badgeText = isCompleted ? successText : pendingText;
        const statusLabel = isCompleted ? 'Payment Completed' : 'Payment Pending';

        page.drawRectangle({
            x: rightLabelX,
            y: txInfoY - 50,
            width: 120,
            height: 20,
            color: badgeBg,
        });
        page.drawText(statusLabel, {
            x: rightLabelX + 8,
            y: txInfoY - 43,
            size: 8,
            font: boldFont,
            color: badgeText,
        });

        // Divider
        page.drawLine({
            start: { x: 50, y: height - 220 },
            end: { x: width - 50, y: height - 220 },
            thickness: 1,
            color: borderColor,
        });

        // Bill To section
        const billToY = height - 260;
        page.drawText('BILLED TO', { x: 50, y: billToY, size: 8, font: boldFont, color: mutedForeground });
        page.drawText(transaction.payer?.name || 'Customer', { x: 50, y: billToY - 25, size: 20, font: boldFont, color: primaryColor });

        const contactY = billToY - 45;
        page.drawText(transaction.payer?.email || 'N/A', { x: 50, y: contactY, size: 10, font: regularFont, color: mutedForeground });
        if (transaction.payer?.phoneNumber) {
            page.drawText(transaction.payer.phoneNumber, { x: 50, y: contactY - 15, size: 10, font: regularFont, color: mutedForeground });
        }
        const locationText = `Location: ${transaction.property?.location?.city || transaction.property?.title || 'Unknown'}`;
        page.drawText(locationText, { x: 50, y: contactY - (transaction.payer?.phoneNumber ? 33 : 18), size: 10, font: boldFont, color: foregroundColor });

        // Payment Info section
        page.drawText('PAYMENT INFO', { x: rightLabelX, y: billToY, size: 8, font: boldFont, color: mutedForeground });

        page.drawText('Date Issued', { x: rightLabelX, y: billToY - 20, size: 8, font: boldFont, color: mutedForeground });
        page.drawText(format(new Date(transaction.createdAt), 'MMM dd, yyyy'), { x: rightLabelX, y: billToY - 35, size: 10, font: boldFont, color: foregroundColor });

        page.drawText('Payment Provider', { x: rightLabelX, y: billToY - 55, size: 8, font: boldFont, color: mutedForeground });
        page.drawText('Chapa Checkout', { x: rightLabelX, y: billToY - 70, size: 10, font: boldFont, color: foregroundColor });

        // Table Header
        const tableY = height - 420;
        page.drawLine({
            start: { x: 50, y: tableY + 20 },
            end: { x: width - 50, y: tableY + 20 },
            thickness: 2,
            color: foregroundColor,
        });
        page.drawText('DESCRIPTION', { x: 50, y: tableY + 5, size: 9, font: boldFont, color: foregroundColor });
        page.drawText('QTY', { x: width - 220, y: tableY + 5, size: 9, font: boldFont, color: foregroundColor });
        page.drawText('UNIT PRICE', { x: width - 160, y: tableY + 5, size: 9, font: boldFont, color: foregroundColor });
        page.drawText('AMOUNT', { x: width - 90, y: tableY + 5, size: 9, font: boldFont, color: foregroundColor });

        // Table Row Item
        const rowY = tableY - 40;
        page.drawText(transaction.property?.title || 'Property Payment', { x: 50, y: rowY, size: 12, font: boldFont, color: foregroundColor });
        page.drawText(transaction.type === 'RENT' ? 'Monthly rent collection' : 'Property payment', { x: 50, y: rowY - 18, size: 10, font: regularFont, color: mutedForeground });

        page.drawText('1', { x: width - 210, y: rowY, size: 10, font: boldFont, color: foregroundColor });
        page.drawText(`ETB ${transaction.amount.toLocaleString()}`, { x: width - 160, y: rowY, size: 10, font: regularFont, color: mutedForeground });
        page.drawText(`ETB ${transaction.amount.toLocaleString()}`, { x: width - 95, y: rowY, size: 12, font: boldFont, color: foregroundColor });

        // Divider after items
        page.drawLine({
            start: { x: 50, y: rowY - 40 },
            end: { x: width - 50, y: rowY - 40 },
            thickness: 1,
            color: borderColor,
        });

        // Summary Section
        const summaryY = rowY - 80;
        const summaryX = width - 240;

        page.drawText('Subtotal', { x: summaryX, y: summaryY, size: 10, font: regularFont, color: mutedForeground });
        page.drawText(`ETB ${transaction.amount.toLocaleString()}`, { x: width - 100, y: summaryY, size: 10, font: boldFont, color: foregroundColor });

        page.drawText('Tax (0%)', { x: summaryX, y: summaryY - 20, size: 10, font: regularFont, color: mutedForeground });
        page.drawText('ETB 0', { x: width - 100, y: summaryY - 20, size: 10, font: boldFont, color: foregroundColor });

        page.drawLine({
            start: { x: summaryX, y: summaryY - 35 },
            end: { x: width - 50, y: summaryY - 35 },
            thickness: 2,
            color: foregroundColor,
        });

        page.drawText('TOTAL AMOUNT', { x: summaryX, y: summaryY - 55, size: 10, font: boldFont, color: primaryColor });

        const totalAmountText = `ETB ${transaction.amount.toLocaleString()}`;
        const totalAmountWidth = boldFont.widthOfTextAtSize(totalAmountText, 32);
        page.drawText(totalAmountText, {
            x: width - totalAmountWidth - 50,
            y: summaryY - 85,
            size: 32,
            font: boldFont,
            color: primaryColor
        });

        // Footer Section
        const footerY = 120;
        page.drawLine({
            start: { x: 50, y: footerY + 30 },
            end: { x: width - 50, y: footerY + 30 },
            thickness: 1,
            color: borderColor,
        });

        // Shield-like icon (Circle with S)
        page.drawCircle({ x: 65, y: footerY, size: 15, color: rgb(0.95, 0.98, 0.96) });
        page.drawText('S', { x: 61, y: footerY - 5, size: 12, font: boldFont, color: primaryColor });

        page.drawText('Secure Payment Gateway', { x: 90, y: footerY + 5, size: 9, font: boldFont, color: foregroundColor });
        page.drawText('Verified by HomeCar Security Cluster', { x: 90, y: footerY - 8, size: 8, font: regularFont, color: mutedForeground });

        const noticeText = 'This is a computer-generated receipt and does not require a physical signature. For support, please contact help@homecar.com.';
        page.drawText(noticeText, {
            x: width - 350,
            y: footerY - 10,
            size: 8,
            font: regularFont,
            color: mutedForeground,
            maxWidth: 300,
        });

        const pdfBytes = await pdfDoc.save();
        const base64 = Buffer.from(pdfBytes).toString('base64');
        const dataUri = `data:application/pdf;base64,${base64}`;

        res.json({ dataUri });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

export const downloadLeaseContract = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const role = req.user?.role?.toUpperCase?.() || '';

        const lease = await prisma.lease.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, name: true, email: true, phoneNumber: true }
                },
                customer: {
                    select: { id: true, name: true, email: true, phoneNumber: true }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        assetType: true,
                        listedById: true,
                        location: {
                            select: {
                                city: true,
                                subcity: true,
                                region: true,
                                village: true
                            }
                        }
                    }
                },
                transactions: {
                    where: { status: 'COMPLETED' },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!lease) {
            return res.status(404).json({ error: 'Lease not found' });
        }

        const canAccess =
            role === 'ADMIN' ||
            lease.ownerId === userId ||
            lease.customerId === userId ||
            lease.property.listedById === userId;

        if (!canAccess) {
            return res.status(403).json({ error: 'You do not have permission to view this agreement' });
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();

        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const primaryColor = rgb(0, 0.353, 0.255);
        const foregroundColor = rgb(0.1, 0.1, 0.1);
        const mutedForeground = rgb(0.45, 0.45, 0.45);
        const borderColor = rgb(0.88, 0.88, 0.88);
        const sectionBg = rgb(0.96, 0.98, 0.97);

        const drawLabelValue = (label: string, value: string, x: number, y: number) => {
            page.drawText(label.toUpperCase(), {
                x,
                y,
                size: 8,
                font: boldFont,
                color: mutedForeground
            });
            page.drawText(value, {
                x,
                y: y - 15,
                size: 11,
                font: regularFont,
                color: foregroundColor
            });
        };

        page.drawText('HomeCar Lease Agreement', {
            x: 50,
            y: height - 70,
            size: 28,
            font: boldFont,
            color: primaryColor
        });

        page.drawText(`Agreement ID: ${lease.id.toUpperCase()}`, {
            x: 50,
            y: height - 95,
            size: 10,
            font: regularFont,
            color: mutedForeground
        });

        page.drawText(format(new Date(), 'MMM dd, yyyy'), {
            x: width - 130,
            y: height - 78,
            size: 10,
            font: boldFont,
            color: foregroundColor
        });

        page.drawLine({
            start: { x: 50, y: height - 115 },
            end: { x: width - 50, y: height - 115 },
            thickness: 1,
            color: borderColor
        });

        const locationParts = [
            lease.property.location?.subcity,
            lease.property.location?.city,
            lease.property.location?.region
        ].filter(Boolean);

        drawLabelValue('Property', lease.property.title, 50, height - 150);
        drawLabelValue('Location', locationParts.length > 0 ? locationParts.join(', ') : 'Unknown location', 300, height - 150);
        drawLabelValue('Lease type', lease.leaseType, 50, height - 205);
        drawLabelValue('Status', lease.status.replace(/_/g, ' '), 300, height - 205);
        drawLabelValue('Start date', format(new Date(lease.startDate), 'MMM dd, yyyy'), 50, height - 260);
        drawLabelValue('End date', format(new Date(lease.endDate), 'MMM dd, yyyy'), 300, height - 260);

        page.drawRectangle({
            x: 50,
            y: height - 360,
            width: width - 100,
            height: 90,
            color: sectionBg,
            borderColor,
            borderWidth: 1
        });

        drawLabelValue('Owner', lease.owner.name, 65, height - 300);
        drawLabelValue('Customer', lease.customer.name, 305, height - 300);
        drawLabelValue('Owner email', lease.owner.email || 'N/A', 65, height - 340);
        drawLabelValue('Customer email', lease.customer.email || 'N/A', 305, height - 340);

        page.drawRectangle({
            x: 50,
            y: height - 455,
            width: width - 100,
            height: 70,
            color: rgb(0.97, 0.97, 0.97),
            borderColor,
            borderWidth: 1
        });

        page.drawText('Financial Terms', {
            x: 65,
            y: height - 408,
            size: 12,
            font: boldFont,
            color: foregroundColor
        });

        const recurringLabel = lease.recurringAmount
            ? `Recurring Payment: ETB ${lease.recurringAmount.toLocaleString()}`
            : 'Recurring Payment: Not specified';
        const totalLabel = `Total Contract Value: ETB ${lease.totalPrice.toLocaleString()}`;

        page.drawText(recurringLabel, {
            x: 65,
            y: height - 430,
            size: 10,
            font: regularFont,
            color: mutedForeground
        });
        page.drawText(totalLabel, {
            x: 320,
            y: height - 430,
            size: 10,
            font: boldFont,
            color: primaryColor
        });

        page.drawText('Terms & Conditions', {
            x: 50,
            y: height - 490,
            size: 14,
            font: boldFont,
            color: foregroundColor
        });

        page.drawText(
            lease.terms.trim().isEmpty
                ? 'No custom lease terms were provided for this agreement.'
                : lease.terms,
            {
                x: 50,
                y: height - 515,
                size: 10,
                font: regularFont,
                color: foregroundColor,
                lineHeight: 15,
                maxWidth: width - 100
            }
        );

        const transactionSummary = lease.transactions.length > 0
            ? `Completed payments linked to this lease: ${lease.transactions.length}`
            : 'No completed payments have been linked to this lease yet.';

        page.drawText('Contract Notes', {
            x: 50,
            y: 165,
            size: 12,
            font: boldFont,
            color: foregroundColor
        });
        page.drawText(transactionSummary, {
            x: 50,
            y: 145,
            size: 10,
            font: regularFont,
            color: mutedForeground
        });
        page.drawText(
            'This agreement is generated from the HomeCar platform records and reflects the accepted lease data between the listed parties.',
            {
                x: 50,
                y: 128,
                size: 9,
                font: regularFont,
                color: mutedForeground,
                lineHeight: 13,
                maxWidth: width - 100
            }
        );

        page.drawLine({
            start: { x: 50, y: 90 },
            end: { x: 220, y: 90 },
            thickness: 1,
            color: borderColor
        });
        page.drawLine({
            start: { x: width - 220, y: 90 },
            end: { x: width - 50, y: 90 },
            thickness: 1,
            color: borderColor
        });
        page.drawText('Owner / Agent Signature', {
            x: 50,
            y: 75,
            size: 9,
            font: regularFont,
            color: mutedForeground
        });
        page.drawText('Customer Signature', {
            x: width - 170,
            y: 75,
            size: 9,
            font: regularFont,
            color: mutedForeground
        });

        const pdfBytes = await pdfDoc.save();
        const base64 = Buffer.from(pdfBytes).toString('base64');
        const dataUri = `data:application/pdf;base64,${base64}`;

        res.json({ dataUri });
    } catch (error: any) {
        console.error('Lease Contract Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate lease agreement PDF' });
    }
};
