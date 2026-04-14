package com.sanslimt.api.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;

@Controller
public class CheckoutController {

    private static final Logger log = LoggerFactory.getLogger(CheckoutController.class);

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public CheckoutController(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/checkout")
    public String checkout(
            @RequestParam(name = "subtotal") BigDecimal subtotal,
            @RequestParam(name = "shipping", required = false, defaultValue = "5.00") BigDecimal shippingCost,
            Principal principal,
            Model model) {

        CheckoutSummary summary = computeSummary(subtotal, shippingCost, principal);

        model.addAttribute("subtotal", summary.getSubtotal());
        model.addAttribute("descuento_aplicado", summary.getDescuento_aplicado());
        model.addAttribute("costo_envio", summary.getCosto_envio());
        model.addAttribute("total_final", summary.getTotal_final());

        return "checkout";
    }

    @GetMapping(value = "/api/checkout", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public CheckoutSummary apiCheckout(
            @RequestParam(name = "subtotal") BigDecimal subtotal,
            @RequestParam(name = "shipping", required = false, defaultValue = "5.00") BigDecimal shippingCost,
            Principal principal) {

        return computeSummary(subtotal, shippingCost, principal);
    }

    private CheckoutSummary computeSummary(BigDecimal subtotal, BigDecimal shippingCost, Principal principal) {
        BigDecimal sub = (subtotal == null) ? BigDecimal.ZERO : subtotal;
        BigDecimal ship = (shippingCost == null) ? BigDecimal.ZERO : shippingCost;
        BigDecimal descuentoAplicado = BigDecimal.ZERO;

        String userId = (principal != null) ? principal.getName() : "anonymous";
        String key = "premio_activo:" + userId;

        try {
            String premioJson = redisTemplate.opsForValue().get(key);
            if (premioJson != null && !premioJson.trim().isEmpty()) {
                Reward premio = objectMapper.readValue(premioJson, Reward.class);
                if (premio != null && premio.getTipo() != null) {
                    String tipo = premio.getTipo().trim().toUpperCase();

                    if ("DESCUENTO".equals(tipo) && premio.getValor() != null) {
                        BigDecimal porcentaje = premio.getValor();
                        if (porcentaje.compareTo(BigDecimal.ONE) <= 0) {
                            // valor like 0.15 => 15%
                            descuentoAplicado = sub.multiply(porcentaje).setScale(2, RoundingMode.HALF_UP);
                        } else {
                            // valor like 15 => 15%
                            descuentoAplicado = sub.multiply(porcentaje).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                        }
                    } else if (tipo.contains("ENVIO") || tipo.contains("ENVÍO") || tipo.contains("GRATIS")) {
                        ship = BigDecimal.ZERO;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error leyendo premio desde Redis (key={}): {}", key, e.getMessage());
        }

        BigDecimal total = sub.subtract(descuentoAplicado).add(ship);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        // Normalize scale
        sub = sub.setScale(2, RoundingMode.HALF_UP);
        descuentoAplicado = descuentoAplicado.setScale(2, RoundingMode.HALF_UP);
        ship = ship.setScale(2, RoundingMode.HALF_UP);
        total = total.setScale(2, RoundingMode.HALF_UP);

        return new CheckoutSummary(sub, descuentoAplicado, ship, total);
    }

    public static class CheckoutSummary {
        @JsonProperty("subtotal")
        private BigDecimal subtotal;
        @JsonProperty("descuento_aplicado")
        private BigDecimal descuento_aplicado;
        @JsonProperty("costo_envio")
        private BigDecimal costo_envio;
        @JsonProperty("total_final")
        private BigDecimal total_final;

        public CheckoutSummary() { }

        public CheckoutSummary(BigDecimal subtotal, BigDecimal descuento_aplicado, BigDecimal costo_envio, BigDecimal total_final) {
            this.subtotal = subtotal;
            this.descuento_aplicado = descuento_aplicado;
            this.costo_envio = costo_envio;
            this.total_final = total_final;
        }

        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

        public BigDecimal getDescuento_aplicado() { return descuento_aplicado; }
        public void setDescuento_aplicado(BigDecimal descuento_aplicado) { this.descuento_aplicado = descuento_aplicado; }

        public BigDecimal getCosto_envio() { return costo_envio; }
        public void setCosto_envio(BigDecimal costo_envio) { this.costo_envio = costo_envio; }

        public BigDecimal getTotal_final() { return total_final; }
        public void setTotal_final(BigDecimal total_final) { this.total_final = total_final; }
    }

    public static class Reward {
        private String tipo;
        private BigDecimal valor;

        public Reward() { }

        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }

        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
    }
}
